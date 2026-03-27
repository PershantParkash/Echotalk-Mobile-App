import React, { useState } from 'react';
import { Modal, Pressable, View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { PhoneInputWithCountry } from "../ui/PhoneInputWithCountry";


type NewContactModalProps = {
  isAddContactModalVisible: boolean;
  closeAddContactModal: () => void;
  firstName: string;
  setFirstName: (v: string) => void;
  lastName: string;
  setLastName: (v: string) => void;
  countryCode: string;
  setCountryCode: (v: string) => void;
  phoneNumber: string;
  setPhoneNumber: (v: string) => void;
  onContinue: () => void;
};

const NewContactModal = ({
  isAddContactModalVisible,
  closeAddContactModal,
  firstName,
  setFirstName,
  lastName,
  setLastName,
  countryCode,
  setCountryCode,
  phoneNumber,
  setPhoneNumber,
  onContinue,
}: NewContactModalProps) => {
  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
  }>({});

  const validate = () => {
    const tempErrors: {
      firstName?: string;
      lastName?: string;
      phoneNumber?: string;
    } = {};

    const first = firstName?.trim?.() ?? '';
    const last = lastName?.trim?.() ?? '';
    const cc = countryCode?.trim?.() ?? '';
    const phone = phoneNumber?.trim?.() ?? '';

    if (!first) tempErrors.firstName = 'First name is required';
    else if (first.length > 50) tempErrors.firstName = 'First name must be 50 characters or less';

    if (!last) tempErrors.lastName = 'Last name is required';
    else if (last.length > 50) tempErrors.lastName = 'Last name must be 50 characters or less';

    if (!cc) tempErrors.phoneNumber = 'Please select a country';
    else if (!phone) tempErrors.phoneNumber = 'Phone number is required';
    else if (!/^\d+$/.test(phone)) tempErrors.phoneNumber = 'Invalid phone number (only digits allowed)';
    else if (!/^\d{10,15}$/.test(phone)) tempErrors.phoneNumber = 'Enter a valid phone number (10-15 digits)';

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handlePressContinue = () => {
    if (!validate()) return;
    onContinue?.();
  };

  return (
    <Modal
      visible={isAddContactModalVisible}
      transparent
      animationType="fade"
      onRequestClose={closeAddContactModal}
    >
      <Pressable
        onPress={closeAddContactModal}
        style={styles.container}
      >
        <Pressable onPress={() => { }} style={styles.contentContainer}>
          <View className="bg-white rounded-2xl px-5 py-5">
            <Text className="text-[16px] font-semibold text-[#092724]">
              Add new contact
            </Text>

            <View className="mt-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                First name
              </Text>
              <TextInput
                value={firstName}
                onChangeText={(t) => {
                  setFirstName(t ?? '');
                  if (errors?.firstName) setErrors({ ...errors, firstName: '' });
                }}
                placeholder="First name"
                placeholderTextColor="#9CA3AF"
                className={`w-full p-4 bg-gray-50 rounded-lg border ${errors?.firstName ? 'border-red-500' : 'border-gray-200'
                  } text-[14px] text-[#092724]`}
                autoCorrect={false}
                autoComplete="name"
                textContentType="givenName"
                keyboardType="default"
                returnKeyType="next"
                autoCapitalize="none"
                maxLength={50}
              />
              {errors?.firstName ? (
                <Text className="text-red-500 text-xs mt-1">
                  {errors.firstName}
                </Text>
              ) : null}
            </View>

            <View className="mt-3">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Last name
              </Text>
              <TextInput
                value={lastName}
                onChangeText={(t) => {
                  setLastName(t ?? '');
                  if (errors?.lastName) setErrors({ ...errors, lastName: '' });
                }}
                placeholder="Last name"
                placeholderTextColor="#9CA3AF"
                className={`w-full p-4 bg-gray-50 rounded-lg border ${errors?.lastName ? 'border-red-500' : 'border-gray-200'
                  } text-[14px] text-[#092724]`}
                autoCorrect={false}
                autoComplete="name-family"
                textContentType="familyName"
                keyboardType="default"
                returnKeyType="next"
                autoCapitalize="none"
                maxLength={50}
              />
              {errors?.lastName ? (
                <Text className="text-red-500 text-xs mt-1">
                  {errors.lastName}
                </Text>
              ) : null}
            </View>

            <PhoneInputWithCountry
              label="Phone Number"
              countryCode={countryCode}
              phoneNumber={phoneNumber}
              onCountryChange={(code) => {
                setCountryCode(code ?? '');
                if (errors?.phoneNumber) setErrors({ ...errors, phoneNumber: '' });
              }}
              onPhoneChange={(text) => {
                setPhoneNumber(text ?? '');
                if (errors?.phoneNumber) setErrors({ ...errors, phoneNumber: '' });
              }}
              error={errors?.phoneNumber}
              placeholder="000-0000000"
              containerClassName="mt-3 mb-0"
              inputClassName="bg-gray-50"
            />

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handlePressContinue}
              className="bg-[#5B2EC4] rounded-2xl h-[45px] justify-center items-center mt-5"
            >
              <Text className="text-white font-semibold text-[15px]">
                Save
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

export default NewContactModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    width: '90%',
  },
});