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
  Image
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import { RootState } from '../../store';
import {
  setCurrentStep,
  setUpdateAppUserExperience,
} from '../../store/user/user.actions';
import { RegisterSteps } from '../../store/user/user.types';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import useUsersService from '../../services/user';

interface Experience {
  company: string;
  title: string;
  startDate: Date | null;
  endDate: Date | null;
}

interface ValidationErrors {
  company?: string;
  title?: string;
  startDate?: string;
  endDate?: string;
}

interface DatePickerState {
  visible: boolean;
  index: number;
  field: 'startDate' | 'endDate';
}

const ExperienceForm: React.FC = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.user);
  const { updateUser } = useUsersService();
  const [errors, setErrors] = useState<ValidationErrors[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showDatePicker, setShowDatePicker] = useState<DatePickerState | null>(
    null,
  );

  const handleAddExperience = (): void => {
    dispatch(
      setUpdateAppUserExperience([
        ...user.experience,
        { company: '', title: '', startDate: null, endDate: null },
      ]),
    );
  };

  const handleRemoveExperience = (index: number): void => {
    if (index > 0) {
      Alert.alert(
        'Remove Experience',
        'Are you sure you want to remove this experience entry?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => {
              const updatedList = user.experience.filter(
                (_: Experience, idx: number) => idx !== index,
              );
              dispatch(setUpdateAppUserExperience(updatedList));
            },
          },
        ],
      );
    }
  };

  const handleExperienceChange = (
    index: number,
    field: keyof Experience,
    value: string | Date | null,
  ): void => {
    const updatedList = user.experience.map(
      (experience: Experience, idx: number) => {
        if (idx === index) {
          return { ...experience, [field]: value };
        }
        return experience;
      },
    );
    dispatch(setUpdateAppUserExperience(updatedList));
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
      handleExperienceChange(
        showDatePicker.index,
        showDatePicker.field,
        selectedDate,
      );
    }
  };

  const validate = (): boolean => {
    const tempErrors: ValidationErrors[] = user.experience.map(
      (experience: Experience) => {
        const errors: ValidationErrors = {};

        if (!experience.company.trim()) {
          errors.company = 'Company is required';
        }

        if (!experience.title.trim()) {
          errors.title = 'Job title is required';
        }

        if (!experience.startDate) {
          errors.startDate = 'Start date is required';
        }

        if (
          experience.startDate &&
          experience.endDate &&
          experience.endDate < experience.startDate
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

  const handleSkip = (): void => {
    dispatch(setCurrentStep(RegisterSteps.Certification));
  };

  const handleUpdateAndNext = async (): Promise<void> => {
    if (!validate()) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Add your API call here
      await updateUser({ experiences: user.experience });

      Alert.alert(
        'Success',
        'Your experience details have been successfully updated.',
      );
      dispatch(setCurrentStep(RegisterSteps.Certification));
    } catch (error: unknown) {
      Alert.alert(
        'Error',
        'An error occurred while updating experience. Please try again later.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = (): void => {
    dispatch(setCurrentStep(RegisterSteps.Education));
  };

  return (
    <View className="flex-1 bg-white px-6">
      <View className="mt-4 h-12 justify-center">
        <TouchableOpacity
                                         onPress={handleBack}
                                         className="absolute  "
                                       >
                                         <Image
                                           source={require('../../assets/Badges Arrow.png')}
                                           className="w-10 h-10 mr-8"
                                           resizeMode="contain"
                                         />
                                       </TouchableOpacity>

        <Text className="text-4xl font-semibold text-center">Experience</Text>
      </View>

      {/* Scrollable Experience List */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {user?.experience.map((experience: Experience, index: number) => (
          <View key={index} className="mb-6">
            {/* Experience Header */}
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-sm font-medium text-gray-700">
                Experience {index + 1}
              </Text>
              {index !== 0 && (
                <TouchableOpacity
                  onPress={() => handleRemoveExperience(index)}
                  className="flex-row items-center"
                >
                  <Feather name="trash-2" size={14} color="#DC2626" />
                  <Text className="text-xs font-semibold text-red-600 ml-1">
                    Remove
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Company Input */}
            <View className="mb-3">
              <Text className="text-sm text-gray-700 mb-2">Company</Text>
              <TextInput
                value={experience.company}
                onChangeText={(value: string) =>
                  handleExperienceChange(index, 'company', value)
                }
                placeholder="Company name"
                className={`bg-gray-100 px-4 py-3 rounded-lg ${
                  errors[index]?.company ? 'border border-red-600' : ''
                }`}
              />
              {errors[index]?.company && (
                <Text className="text-xs text-red-600 mt-1">
                  {errors[index]?.company}
                </Text>
              )}
            </View>

            {/* Title Input */}
            <View className="mb-3">
              <Text className="text-sm text-gray-700 mb-2">Job Title</Text>
              <TextInput
                value={experience.title}
                onChangeText={(value: string) =>
                  handleExperienceChange(index, 'title', value)
                }
                placeholder="Job title"
                className={`bg-gray-100 px-4 py-3 rounded-lg ${
                  errors[index]?.title ? 'border border-red-600' : ''
                }`}
              />
              {errors[index]?.title && (
                <Text className="text-xs text-red-600 mt-1">
                  {errors[index]?.title}
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
                      experience.startDate ? 'text-black' : 'text-gray-400'
                    }
                  >
                    {experience.startDate
                      ? formatDate(experience.startDate)
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
                <Text className="text-sm text-gray-700 mb-2">
                  End Date (Optional)
                </Text>
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
                      experience.endDate ? 'text-black' : 'text-gray-400'
                    }
                  >
                    {experience.endDate
                      ? formatDate(experience.endDate)
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
        ))}

        {/* Add Experience Button */}
        <TouchableOpacity
          onPress={handleAddExperience}
          className="flex-row items-center justify-end mb-4"
        >
          <Feather name="plus" size={16} color="#5B2EC4" />
          <Text className="text-[#5B2EC4] font-semibold text-sm ml-1">
            Add Experience
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Action Buttons */}
      <View className="flex-row gap-3 pb-6">
        <TouchableOpacity
          onPress={handleSkip}
          className="flex-1 h-12 border border-gray-400 rounded-lg justify-center items-center"
        >
          <Text className="text-gray-700 text-base font-medium">Skip</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleUpdateAndNext}
          disabled={loading}
          className="flex-1 h-12 bg-[#5B2EC4] rounded-lg justify-center items-center"
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-base font-semibold">Next</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={
            showDatePicker.field === 'startDate'
              ? user.experience[showDatePicker.index].startDate || new Date()
              : user.experience[showDatePicker.index].endDate || new Date()
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

export default ExperienceForm;
