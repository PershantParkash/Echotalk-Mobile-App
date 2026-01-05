import {
  Text,
  View,
  Image,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import AccountType from '../register-forms/AccountType';
import UserType from '../register-forms/UserType';
import PhoneAndPassword from '../register-forms/PhoneAndPassword';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { RegisterSteps } from '../../store/user/user.types';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function RegisterMain() {
  const { currentStep } = useSelector((state: RootState) => state.user);

  const renderStep = () => {
    switch (currentStep) {
      case RegisterSteps.AccountType:
        return <AccountType />;
      case RegisterSteps.UserType:
        return <UserType />;
      case RegisterSteps.PhonePassword:
        return <PhoneAndPassword />;
      // case RegisterSteps.PhoneVerification:
      //   return <PhoneVerificationForm />;
      // case RegisterSteps.PersonalDetails:
      //   return <PersonalDetailsForm />;
      // case RegisterSteps.Education:
      //   return <EducationForm />;
      // case RegisterSteps.Experience:
      //   return <ExperienceForm />;
      // case RegisterSteps.Certification:
      //   return <CertificationForm />;
      default:
        return <div></div>;
    }
  };
  return (
    <View className="flex-1 items-center justify-center bg-[#5B2EC4]">
      <Image
        source={require('../../assets/decorator1.png')}
        className="absolute right-0"
      />
      <Image
        source={require('../../assets/decorator2.png')}
        className="absolute left-0 bottom-0"
      />
      <Image
        source={require('../../assets/decorator3.png')}
        className="absolute left-0 top-0"
      />
      <View className="absolute top-0 w-full h-[40%] items-center justify-center rounded-xl">
        <Image
          source={require('../../assets/AuthPerson.png')}
          className="w-[220px] h-[220px] absolute bottom-0"
        />
      </View>
      <ScrollView className="absolute bottom-0 w-full h-[60%] bg-white rounded-xl">
        {renderStep()}
      </ScrollView>
    </View>
  );
}
