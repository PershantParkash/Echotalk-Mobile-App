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
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import { RootState } from '../../store';
import {
  setCurrentStep,
  setUpdateAppUserEducation,
} from '../../store/user/user.actions';
import { RegisterSteps, UserEducation } from '../../store/user/user.types';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

interface ValidationErrors {
  institute?: string;
  areaOfStudy?: string;
  startDate?: string;
  endDate?: string;
}

interface DatePickerState {
  visible: boolean;
  index: number;
  field: 'startDate' | 'endDate';
}

const EducationForm: React.FC = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.user);
  
  const [errors, setErrors] = useState<ValidationErrors[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showDatePicker, setShowDatePicker] = useState<DatePickerState | null>(null);

  const handleAddEducation = (): void => {
    dispatch(
      setUpdateAppUserEducation([
        ...user.education,
        { institute: '', areaOfStudy: '', startDate: null, endDate: null },
      ])
    );
  };

  const handleRemoveEducation = (index: number): void => {
    if (index > 0) {
      Alert.alert(
        'Remove Education',
        'Are you sure you want to remove this education entry?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => {
              const updatedList = user.education.filter((_: UserEducation, idx: number) => idx !== index);
              dispatch(setUpdateAppUserEducation(updatedList));
            },
          },
        ]
      );
    }
  };

  const handleEducationChange = (
    index: number,
    field: keyof UserEducation,
    value: string | Date | null
  ): void => {
    const updatedList = user.education.map((education: UserEducation, idx: number) => {
      if (idx === index) {
        return { ...education, [field]: value };
      }
      return education;
    });
    dispatch(setUpdateAppUserEducation(updatedList));
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date): void => {
    if (Platform.OS === 'android') {
      setShowDatePicker(null);
    }

    if (selectedDate && showDatePicker) {
      handleEducationChange(
        showDatePicker.index,
        showDatePicker.field,
        selectedDate
      );
    }
  };

  const validate = (): boolean => {
    const tempErrors: ValidationErrors[] = user.education.map((education: UserEducation) => {
      const errors: ValidationErrors = {};

      if (!education.institute.trim()) {
        errors.institute = 'Institute name is required';
      }

      if (!education.areaOfStudy.trim()) {
        errors.areaOfStudy = 'Area of Study is required';
      }

      if (!education.startDate) {
        errors.startDate = 'Start date is required';
      }

      if (
        education.startDate &&
        education.endDate &&
        education.endDate < education.startDate
      ) {
        errors.endDate = 'End date cannot be before start date';
      }

      return errors;
    });

    setErrors(tempErrors);
    return tempErrors.every((error: ValidationErrors) => Object.keys(error).length === 0);
  };

  const handleSkip = (): void => {
    dispatch(setCurrentStep(RegisterSteps.Experience));
  };

  const handleUpdateAndNext = async (): Promise<void> => {
    if (!validate()) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Add your API call here
      // await updateUser({ educations: user.education });
      
      Alert.alert('Success', 'Your education details have been successfully updated.');
      dispatch(setCurrentStep(RegisterSteps.Experience));
    } catch (error: unknown) {
      Alert.alert(
        'Error',
        'An error occurred while updating education. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = (): void => {
    dispatch(setCurrentStep(RegisterSteps.PersonalDetails));
  };

  return (
    <View className="flex-1 bg-white px-6 pt-6">
      {/* Header */}
      <View className="mb-6">
        <TouchableOpacity onPress={handleBack} className="mb-4">
          <MaterialIcons name="arrow-back-ios" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-3xl font-semibold">Education</Text>
      </View>

      {/* Scrollable Education List */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {user?.education.map((education: UserEducation, index: number) => (
          <View key={index} className="mb-6">
            {/* Education Header */}
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-sm font-medium text-gray-700">
                Education {index + 1}
              </Text>
              {index !== 0 && (
                <TouchableOpacity
                  onPress={() => handleRemoveEducation(index)}
                  className="flex-row items-center"
                >
                  <Feather name="trash-2" size={14} color="#DC2626" />
                  <Text className="text-xs font-semibold text-red-600 ml-1">
                    Remove
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Institute Input */}
            <View className="mb-3">
              <Text className="text-sm text-gray-700 mb-2">Institute</Text>
              <TextInput
                value={education.institute}
                onChangeText={(value: string) =>
                  handleEducationChange(index, 'institute', value)
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

            {/* Area of Study Input */}
            <View className="mb-3">
              <Text className="text-sm text-gray-700 mb-2">Area of Study</Text>
              <TextInput
                value={education.areaOfStudy}
                onChangeText={(value: string) =>
                  handleEducationChange(index, 'areaOfStudy', value)
                }
                placeholder="Area of study"
                className={`bg-gray-100 px-4 py-3 rounded-lg ${
                  errors[index]?.areaOfStudy ? 'border border-red-600' : ''
                }`}
              />
              {errors[index]?.areaOfStudy && (
                <Text className="text-xs text-red-600 mt-1">
                  {errors[index]?.areaOfStudy}
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
                    setShowDatePicker({ visible: true, index, field: 'startDate' })
                  }
                  className={`bg-gray-100 px-4 py-3 rounded-lg ${
                    errors[index]?.startDate ? 'border border-red-600' : ''
                  }`}
                >
                  <Text className={education.startDate ? 'text-black' : 'text-gray-400'}>
                    {education.startDate
                      ? formatDate(education.startDate)
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
                    setShowDatePicker({ visible: true, index, field: 'endDate' })
                  }
                  className={`bg-gray-100 px-4 py-3 rounded-lg ${
                    errors[index]?.endDate ? 'border border-red-600' : ''
                  }`}
                >
                  <Text className={education.endDate ? 'text-black' : 'text-gray-400'}>
                    {education.endDate
                      ? formatDate(education.endDate)
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

        {/* Add Education Button */}
        <TouchableOpacity
          onPress={handleAddEducation}
          className="flex-row items-center justify-end mb-4"
        >
          <Feather name="plus" size={16} color="#5B2EC4" />
          <Text className="text-[#5B2EC4] font-semibold text-sm ml-1">
            Add Education
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
              ? user.education[showDatePicker.index].startDate || new Date()
              : user.education[showDatePicker.index].endDate || new Date()
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

export default EducationForm;