import { useState } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import { RootState } from '../../store';
import {
  setCurrentStep,
  setUpdateAppUserCertification,
} from '../../store/user/user.actions';
import { RegisterSteps, UserCertification } from '../../store/user/user.types';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import useUsersService from '../../services/user';
import { saveTokens } from '../../utils/storage';
import Toast from 'react-native-toast-message';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/navigation';

interface Certification {
  certificationName: string;
  institute: string;
  startDate: Date | null;
  endDate: Date | null;
}

interface ValidationErrors {
  certificationName?: string;
  institute?: string;
  startDate?: string;
  endDate?: string;
}

interface DatePickerState {
  visible: boolean;
  index: number;
  field: 'startDate' | 'endDate';
}
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

const CertificationForm: React.FC = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation<NavigationProp>();
  const { user } = useSelector((state: RootState) => state.user);
  const {
    updateUser,
    switchToTrainer,
    loading: apiLoading,
  } = useUsersService();
  const [errors, setErrors] = useState<ValidationErrors[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showDatePicker, setShowDatePicker] = useState<DatePickerState | null>(
    null,
  );

  const handleAddCertification = (): void => {
    dispatch(
      setUpdateAppUserCertification([
        ...user.certification,
        {
          certificationName: '',
          institute: '',
          startDate: null,
          endDate: null,
        },
      ]),
    );
  };

  const handleRemoveCertification = (index: number): void => {
    if (index > 0) {
      Alert.alert(
        'Remove Certification',
        'Are you sure you want to remove this certification entry?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => {
              const updatedList = user.certification.filter(
                (_: UserCertification, idx: number) => idx !== index,
              );
              dispatch(setUpdateAppUserCertification(updatedList));
            },
          },
        ],
      );
    }
  };

  const handleCertificationChange = (
    index: number,
    field: keyof Certification,
    value: string | Date | null,
  ): void => {
    const updatedList = user.certification.map(
      (certification: UserCertification, idx: number) => {
        if (idx === index) {
          return { ...certification, [field]: value };
        }
        return certification;
      },
    );
    dispatch(setUpdateAppUserCertification(updatedList));
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ): void => {
    if (Platform.OS === 'android') {
      setShowDatePicker(null);
    }

    if (selectedDate && showDatePicker) {
      handleCertificationChange(
        showDatePicker.index,
        showDatePicker.field,
        selectedDate,
      );
    }
  };

  const validate = (): boolean => {
    const tempErrors: ValidationErrors[] = user.certification.map(
      (certification: UserCertification) => {
        const errors: ValidationErrors = {};

        if (!certification.certificationName.trim()) {
          errors.certificationName = 'Certification name is required';
        }

        if (!certification.institute.trim()) {
          errors.institute = 'Institute name is required';
        }

        if (!certification.startDate) {
          errors.startDate = 'Start date is required';
        }

        if (
          certification.startDate &&
          certification.endDate &&
          certification.endDate < certification.startDate
        ) {
          errors.endDate = 'End date cannot be before start date';
        }

        return errors;
      },
    );

    setErrors(tempErrors);
    return tempErrors.every(
      (error: ValidationErrors) => Object.keys(error).length === 0,
    );
  };

  const handleSkip = async (): Promise<void> => {
    setLoading(true);
    try {
      // Add your API call here
      // const response = await switchToTrainer();
      // await saveTokens(response.accessToken, response.refreshToken);

      // Navigate to trainer dashboard
      navigation.reset({
        index: 0,
        routes: [{ name: 'TrainerDashboard' as never }],
      });
    } catch (error: unknown) {
      Alert.alert(
        'Error',
        'Failed to complete registration. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAndNext = async (): Promise<void> => {
    if (!validate()) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await updateUser({ certifications: user.certification });
      const response = await switchToTrainer();
      await saveTokens(response.accessToken, response.refreshToken);

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Your certification details have been successfully updated.',
      });

      navigation.replace('MainTabs', { screen: 'HomeTab' });
    } catch (error: unknown) {
      Alert.alert(
        'Error',
        'An error occurred while updating certification. Please try again later.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = (): void => {
    dispatch(setCurrentStep(RegisterSteps.Experience));
  };

  return (
    <View className="flex-1 bg-white px-6">
      {/* Header */}
      <View className="mt-4 h-12 justify-center">
        <TouchableOpacity onPress={handleBack} className="absolute  ">
          <Image
            source={require('../../assets/Badges Arrow.png')}
            className="w-10 h-10 mr-8"
            resizeMode="contain"
          />
        </TouchableOpacity>

        <Text className="text-4xl font-semibold text-center">
          Certification
        </Text>
      </View>

      {/* Scrollable Certification List */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {user?.certification.map(
          (certification: UserCertification, index: number) => (
            <View key={index} className="mb-6">
              {/* Certification Header */}
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-sm font-medium text-gray-700">
                  Certification {index + 1}
                </Text>
                {index !== 0 && (
                  <TouchableOpacity
                    onPress={() => handleRemoveCertification(index)}
                    className="flex-row items-center"
                  >
                    <Feather name="trash-2" size={14} color="#DC2626" />
                    <Text className="text-xs font-semibold text-red-600 ml-1">
                      Remove
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Certification Name Input */}
              <View className="mb-3">
                <Text className="text-sm text-gray-700 mb-2">
                  Certification Name
                </Text>
                <TextInput
                  value={certification.certificationName}
                  onChangeText={(value: string) =>
                    handleCertificationChange(index, 'certificationName', value)
                  }
                  placeholder="Certification name"
                  className={`bg-gray-100 px-4 py-3 rounded-lg ${
                    errors[index]?.certificationName
                      ? 'border border-red-600'
                      : ''
                  }`}
                />
                {errors[index]?.certificationName && (
                  <Text className="text-xs text-red-600 mt-1">
                    {errors[index]?.certificationName}
                  </Text>
                )}
              </View>

              {/* Institute Input */}
              <View className="mb-3">
                <Text className="text-sm text-gray-700 mb-2">Institute</Text>
                <TextInput
                  value={certification.institute}
                  onChangeText={(value: string) =>
                    handleCertificationChange(index, 'institute', value)
                  }
                  placeholder="Institute name"
                  className={`bg-gray-100 px-4 py-3 rounded-lg ${
                    errors[index]?.institute ? 'border border-red-600' : ''
                  }`}
                />
                {errors[index]?.institute && (
                  <Text className="text-xs text-red-600 mt-1">
                    {errors[index]?.institute}
                  </Text>
                )}
              </View>

              {/* Date Inputs */}
              <View className="flex-row gap-3">
                {/* Start Date */}
                <View className="flex-1">
                  <Text className="text-sm text-gray-700 mb-2">Start Date</Text>
                  <TouchableOpacity
                    onPress={() =>
                      setShowDatePicker({
                        visible: true,
                        index,
                        field: 'startDate',
                      })
                    }
                    className={`bg-gray-100 px-4 py-3 rounded-lg ${
                      errors[index]?.startDate ? 'border border-red-600' : ''
                    }`}
                  >
                    <Text
                      className={
                        certification.startDate ? 'text-black' : 'text-gray-400'
                      }
                    >
                      {certification.startDate
                        ? formatDate(certification.startDate)
                        : 'Select date'}
                    </Text>
                  </TouchableOpacity>
                  {errors[index]?.startDate && (
                    <Text className="text-xs text-red-600 mt-1">
                      {errors[index]?.startDate}
                    </Text>
                  )}
                </View>

                {/* End Date */}
                <View className="flex-1">
                  <Text className="text-sm text-gray-700 mb-2">End Date</Text>
                  <TouchableOpacity
                    onPress={() =>
                      setShowDatePicker({
                        visible: true,
                        index,
                        field: 'endDate',
                      })
                    }
                    className={`bg-gray-100 px-4 py-3 rounded-lg ${
                      errors[index]?.endDate ? 'border border-red-600' : ''
                    }`}
                  >
                    <Text
                      className={
                        certification.endDate ? 'text-black' : 'text-gray-400'
                      }
                    >
                      {certification.endDate
                        ? formatDate(certification.endDate)
                        : 'Select date'}
                    </Text>
                  </TouchableOpacity>
                  {errors[index]?.endDate && (
                    <Text className="text-xs text-red-600 mt-1">
                      {errors[index]?.endDate}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          ),
        )}

        {/* Add Certification Button */}
        <TouchableOpacity
          onPress={handleAddCertification}
          className="flex-row items-center justify-end mb-4"
        >
          <Feather name="plus" size={16} color="#5B2EC4" />
          <Text className="text-[#5B2EC4] font-semibold text-sm ml-1">
            Add Certification
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Action Buttons */}
      <View className="flex-row gap-3 pb-6">
        <TouchableOpacity
          onPress={handleSkip}
          disabled={loading}
          className="flex-1 h-12 border border-gray-400 rounded-lg justify-center items-center"
        >
          {loading ? (
            <ActivityIndicator color="#5B2EC4" />
          ) : (
            <Text className="text-gray-700 text-base font-medium">Skip</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleUpdateAndNext}
          disabled={loading}
          className="flex-1 h-12 bg-[#5B2EC4] rounded-lg justify-center items-center"
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-base font-semibold">
              Continue to dashboard
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={
            showDatePicker.field === 'startDate'
              ? user.certification[showDatePicker.index].startDate || new Date()
              : user.certification[showDatePicker.index].endDate || new Date()
          }
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}

      {/* iOS Date Picker Done Button */}
      {showDatePicker && Platform.OS === 'ios' && (
        <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-300">
          <TouchableOpacity
            onPress={() => setShowDatePicker(null)}
            className="p-4 items-end"
          >
            <Text className="text-[#5B2EC4] font-semibold text-base">Done</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default CertificationForm;
