import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  Keyboard,
} from 'react-native';
import COUNTRY_LIST from '../../constants/countries.json';
import { getExampleNumber } from 'libphonenumber-js';
import examples from 'libphonenumber-js/examples.mobile.json';
import type { CountryCode } from 'libphonenumber-js';


export type CountryOption = {
  name: string;
  isoCode: string;
  phonecode: string;
  flag: string;
};

function normalizeDialCode(code: string): string {
  return code.replace(/\D/g, '') || '';
}

const maxNationalDigitsByIso = new Map<string, number>();

function getMaxNationalDigits(isoCode?: string | null): number | undefined {
  const iso = isoCode?.trim?.()?.toUpperCase?.() ?? '';
  if (!iso) return undefined;
  const cached = maxNationalDigitsByIso.get(iso);
  if (typeof cached === 'number') return cached;

  try {
    const example = getExampleNumber(iso as CountryCode, examples);
    const national = example?.nationalNumber ?? '';
    const maxDigits = String(national)?.replace?.(/\D/g, '')?.length ?? 0;
    if (maxDigits > 0) {
      maxNationalDigitsByIso.set(iso, maxDigits);
      return maxDigits;
    }
  } catch {
    // ignore; fallback handled by returning undefined
  }

  return undefined;
}

export type PhoneInputWithCountryProps = {
  countryCode: string;
  phoneNumber: string;
  onCountryChange: (dialCode: string) => void;
  onPhoneChange: (nationalNumber: string) => void;
  error?: string;
  editable?: boolean;
  placeholder?: string;
  containerClassName?: string;
  inputClassName?: string;
  label?: string;
};

export function PhoneInputWithCountry({
  countryCode,
  phoneNumber,
  onCountryChange,
  onPhoneChange,
  error,
  editable = true,
  placeholder = '000-0000000',
  containerClassName = '',
  inputClassName = '',
  label = 'Phone number',
}: PhoneInputWithCountryProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedCountry = countryCode?.trim()
    ? COUNTRY_LIST.find(
      c =>
        normalizeDialCode(c.phonecode) === normalizeDialCode(countryCode),
    ) ?? null
    : null;

  const maxNationalDigits = useMemo(() => {
    return getMaxNationalDigits(selectedCountry?.isoCode ?? undefined);
  }, [selectedCountry?.isoCode]);

  useEffect(() => {
    if (!maxNationalDigits) return;
    const cleaned = phoneNumber?.replace?.(/\D/g, '') ?? '';
    if (cleaned.length > maxNationalDigits) {
      onPhoneChange(cleaned.slice(0, maxNationalDigits));
    }
  }, [maxNationalDigits, onPhoneChange, phoneNumber]);

  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return COUNTRY_LIST;
    const qRaw = searchQuery.toLowerCase().trim();
    const qDigits = normalizeDialCode(searchQuery);
    const qAlpha = qRaw.replace(/[^a-z]/g, '');
    return COUNTRY_LIST.filter(
      c =>
        c.name?.toLowerCase().includes(qRaw) ||
        (!!qDigits && normalizeDialCode(c.phonecode).includes(qDigits)) ||
        (!!qAlpha && c.isoCode?.toLowerCase().includes(qAlpha)),
    );
  }, [searchQuery]);

  const handleSelectCountry = (country: CountryOption) => {
    onCountryChange(normalizeDialCode(country.phonecode) || country.phonecode);
    setModalVisible(false);
    setSearchQuery('');
    Keyboard.dismiss();
  };

  const displayCode = selectedCountry
    ? `+${normalizeDialCode(selectedCountry.phonecode) || selectedCountry.phonecode}`
    : null;

  return (
    <View className={`mb-4 ${containerClassName}`}>
      {label ? (
        <Text className="text-sm font-medium text-gray-700 mb-1">{label}</Text>
      ) : null}
      <View
        className={`flex-row rounded-lg border overflow-hidden ${error ? 'border-red-500' : 'border-gray-300'
          }`}
      >
        <TouchableOpacity
          onPress={() => editable && setModalVisible(true)}
          disabled={!editable}
          className="flex-row items-center pl-3 py-3 bg-gray-50"
          activeOpacity={0.7}
        >
          <Text className="text-xl mr-2">
            {selectedCountry?.flag ?? ''}
          </Text>
          <Text
            className={displayCode ? 'text-black' : 'text-[#9CA3AF]'}
            numberOfLines={1}
          >
            {displayCode ?? '+00'}
          </Text>
        </TouchableOpacity>
        <TextInput
          className={`flex-1 pr-4 py-3 ${inputClassName}`}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={phoneNumber}
          onChangeText={text => {
            const cleaned = text?.replace?.(/\D/g, '') ?? '';
            const limited = maxNationalDigits
              ? cleaned.slice(0, maxNationalDigits)
              : cleaned;
            onPhoneChange(limited);
          }}
          keyboardType="phone-pad"
          editable={editable}
          maxLength={maxNationalDigits}
          onPress={() => !displayCode && setModalVisible(true)}
        />
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
          className="flex-1 bg-black/50 justify-end"
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => { }}
            className="bg-white rounded-t-2xl h-[80%]"
          >
            <View className="p-4 border-b border-gray-200">
              <Text className="text-lg font-semibold text-gray-800 mb-3">
                Select country
              </Text>
              <TextInput
                className="w-full px-4 py-3 bg-gray-100 rounded-lg border border-gray-200"
                placeholder="Search country or code..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus={true}
              />
            </View>
            <FlatList
              data={filteredCountries}
              keyExtractor={item => item.isoCode}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={30}
              maxToRenderPerBatch={40}
              windowSize={10}
              ListEmptyComponent={
                <View className="py-8 items-center">
                  <Text className="text-gray-500">No countries found</Text>
                </View>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelectCountry(item)}
                  className="flex-row items-center px-4 py-3 border-b border-gray-100"
                  activeOpacity={0.6}
                >
                  <Text className="text-2xl mr-4">{item.flag}</Text>
                  <View className="flex-1">
                    <Text className="text-gray-800 font-medium">
                      {item.name}
                    </Text>
                    <Text className="text-gray-500 text-sm">
                      +{normalizeDialCode(item.phonecode) || item.phonecode}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {error ? (
        <Text className="text-red-500 text-xs mt-1">{error}</Text>
      ) : null}
    </View>
  );
}