import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Fontisto from 'react-native-vector-icons/Fontisto';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import useCourseService from '../services/course';
import useServicesService from '../services/services';
import useUsersService from '../services/user';
import { setUserDetails } from '../store/user/user.actions';
import { useSelector, useDispatch } from 'react-redux';
import Toast from 'react-native-toast-message';
import { RootState } from '../store/index';
import { Course } from '../store/course/courses.types';
import { Service } from '../store/services/services.types';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { TabParamList } from '../navigation/navigation';
import { useNavigation } from '@react-navigation/native';

type HomeScreenNavigationProp = BottomTabNavigationProp<
  TabParamList,
  'HomeTab'
>;

interface Category {
  id: string;
  name: string;
  icon: string;
  library: 'Fontisto' | 'Feather';
}

const categories: Category[] = [
  { id: '1', name: 'Language', icon: 'world-o', library: 'Fontisto' },
  { id: '2', name: 'Communication', icon: 'users', library: 'Feather' },
  { id: '3', name: 'Email', icon: 'email', library: 'Fontisto' },
  { id: '4', name: 'Business', icon: 'briefcase', library: 'Feather' },
];

const DEFAULT_IMAGE =
  'https://via.placeholder.com/300x200/7c3aed/ffffff?text=No+Image';

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '');

const Header: React.FC = () => {
  const { userDetails, user, firebaseOtpVerificationId } = useSelector(
    (state: RootState) => state.user,
  );
  return (
    <View className="px-5 pt-4 pb-2">
      <View className="flex-row justify-between items-center mb-2">
        <View>
          <Text className="text-xl font-bold text-gray-800">
            Hi {userDetails.fullName || 'Guest'} 👋
          </Text>
          <View className="flex-row items-center mt-1">
            <Text className="text-sm text-gray-600">Let's Find Your </Text>
            <Text className="text-sm text-purple-600 font-semibold">
              Course!
            </Text>
          </View>
        </View>
        <View className="flex-row gap-3">
          <TouchableOpacity className="w-10 h-10 items-center justify-center">
            <Ionicons name="basket-outline" size={22} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity className="w-10 h-10 items-center justify-center">
            <Fontisto name="bell" size={20} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const SearchBar: React.FC = () => {
  return (
    <View className="px-5 mb-5">
      <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
        <Image
          source={require('../assets/search.png')}
          className="w-6 h-6 mr-2"
          resizeMode="contain"
        />
        <TextInput
          placeholder="Search your course..."
          placeholderTextColor="#9CA3AF"
          className="flex-1 text-gray-800 text-base"
        />
        <TouchableOpacity>
          <Image
            source={require('../assets/Filter.png')}
            className="w-6 h-6 mr-2"
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const Categories: React.FC = () => {
  return (
    <View className="px-5 mb-6">
      <View className="flex-row justify-between">
        {categories.map(category => (
          <TouchableOpacity key={category.id} className="items-center w-20">
            <View className="w-16 h-16 bg-purple-50 rounded-2xl items-center justify-center mb-2">
              {category.library === 'Fontisto' && (
                <Fontisto name={category.icon} size={24} color="#7c3aed" />
              )}
              {category.library === 'Feather' && (
                <Feather name={category.icon} size={24} color="#7c3aed" />
              )}
            </View>
            <Text className="text-xs text-gray-600 text-center">
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const ContinueCourseCard: React.FC<{ course: Course | null }> = ({
  course,
}) => {
  if (!course) return null;

  const imageUri =
    course.image || course.thumbnail || course.coverImage || DEFAULT_IMAGE;
  const author = course.author || course.instructor || 'Unknown Instructor';

  return (
    <View className="px-5 mb-6">
      <LinearGradient
        colors={['#8B5CF6', '#7C3AED', '#6D28D9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientCard}
      >
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text className="text-white text-xs opacity-80 mb-2">
              Ongoing • {course.currentLesson || 0}/{course.totalLessons || 0}
            </Text>
            <Text className="text-white text-xl font-bold mb-1">
              {course.title}
            </Text>
            <Text className="text-white text-xs opacity-80 mb-4">
              by {author}
            </Text>
            <TouchableOpacity className="bg-purple-800 rounded-xl px-6 py-3 self-start">
              <Text className="text-white font-semibold">Continue</Text>
            </TouchableOpacity>
          </View>

          <View className="items-center justify-center">
            <View className="w-24 h-24 rounded-full bg-white/20 items-center justify-center">
              <View className="w-20 h-20 rounded-full bg-white items-center justify-center">
                <Text className="text-purple-600 text-2xl font-bold">
                  {course.progress || 0}%
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className="flex-row gap-1 mt-4 justify-center">
          <View className="w-2 h-2 rounded-full bg-white" />
          <View className="w-2 h-2 rounded-full bg-white/50" />
          <View className="w-2 h-2 rounded-full bg-white/50" />
        </View>
      </LinearGradient>
    </View>
  );
};

const CourseCard: React.FC<{ course: Course }> = ({ course }) => {
  const imageUri =
    course.image || course.thumbnail || course.coverImage || DEFAULT_IMAGE;
  const author = course.author || course.instructor || 'Unknown Instructor';
  const price = course.price || 0;
  const originalPrice = course.originalPrice || price;
  const rating = Number(course.rating) || 0;
  const reviews = course.reviews || 0;
  const modules = course.modules || 0;

  return (
    <View style={styles.card}>
      <View className="relative">
        <Image
          source={{ uri: imageUri }}
          className="w-full h-40"
          resizeMode="cover"
          defaultSource={{ uri: DEFAULT_IMAGE }}
        />
        <View className="absolute inset-0 items-center justify-center bg-black/20">
          <View className="w-14 h-14 rounded-full bg-purple-600 items-center justify-center">
            <Text className="text-white text-2xl">▶</Text>
          </View>
        </View>
      </View>

      <View className="p-4">
        <Text
          className="text-base font-bold text-gray-800 mb-1"
          numberOfLines={2}
        >
          {course.title}
        </Text>
        <Text className="text-xs text-gray-500 mb-2" numberOfLines={1}>
          {author}
        </Text>

        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center gap-2">
            <Text className="text-lg font-bold text-purple-600">${price}</Text>
            {originalPrice > price && (
              <Text style={styles.strikethrough}>${originalPrice}</Text>
            )}
          </View>
          <Text className="text-xs text-gray-500">
            {modules} module{modules !== 1 ? 's' : ''}
          </Text>
        </View>

        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Text className="text-sm font-bold text-gray-800 mr-1">
              {rating > 0 ? rating.toFixed(1) : '0.0'}
            </Text>
            <View className="flex-row mr-1">
              {[1, 2, 3, 4, 5].map(star => (
                <FontAwesome5
                  key={star}
                  name="star"
                  size={12}
                  color={star <= rating ? '#FBBF24' : '#D1D5DB'}
                  solid={star <= rating}
                />
              ))}
            </View>
            <Text className="text-xs text-gray-400">({reviews})</Text>
          </View>
          <TouchableOpacity>
            <MaterialCommunityIcons
              name="cards-heart-outline"
              size={22}
              color="#F87171"
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const ServiceCard: React.FC<{ service: Service }> = ({ service }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Get images from attachments or fallback to default
  const images =
    service.attachments && service.attachments.length > 0
      ? service.attachments
      : [service.image || service.thumbnail || DEFAULT_IMAGE];

  const title = service.title || service.name || 'Unknown Service';
  const price =
    typeof service.price === 'string'
      ? parseFloat(service.price)
      : service.price || 0;
  const originalPrice = service.originalPrice || price;
  const bookings = service.bookings || 0;
  const rating = service.rating || 0;

  // Auto-cycle through images every 2 seconds
  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIndex(prevIndex =>
        prevIndex === images.length - 1 ? 0 : prevIndex + 1,
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <View style={styles.card}>
      {/* Image Container with Indicators */}
      <View className="relative">
        <Image
          source={{ uri: images[currentImageIndex] }}
          className="w-full h-40"
          resizeMode="cover"
          defaultSource={{ uri: DEFAULT_IMAGE }}
        />

        {/* Image Indicators - compact version */}
        {images.length > 1 && (
          <View className="absolute bottom-2 left-0 right-0 flex-row justify-center">
            {images.map((_, index) => (
              <View
                key={index}
                className={`h-1 rounded-full mx-0.5 ${
                  currentImageIndex === index
                    ? 'bg-white w-4'
                    : 'bg-white/50 w-1'
                }`}
              />
            ))}
          </View>
        )}

        {/* Image Counter - smaller version */}
        {images.length > 1 && (
          <View className="absolute top-2 right-2 bg-black/60 px-1.5 py-0.5 rounded">
            <Text className="text-white text-[10px] font-semibold">
              {currentImageIndex + 1}/{images.length}
            </Text>
          </View>
        )}
      </View>

      <View className="p-4">
        <Text
          className="text-base font-bold text-gray-800 mb-1"
          numberOfLines={1}
        >
          {title}
        </Text>

        <Text className="text-xs text-gray-500 mb-2" numberOfLines={2}>
          {stripHtml(service.description)}
        </Text>

        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center gap-2">
            <Text className="text-lg font-bold text-purple-600">
              ${price.toFixed(2)}
            </Text>
            {originalPrice > price && (
              <Text style={styles.strikethrough}>
                ${originalPrice.toFixed(2)}
              </Text>
            )}
          </View>
          <Text className="text-xs text-gray-500">
            {bookings} booking{bookings !== 1 ? 's' : ''}
          </Text>
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-bold text-gray-800">
            {rating.toFixed(1)}{' '}
            <FontAwesome5 name="star" size={12} color="#FBBF24" solid />
          </Text>
          <TouchableOpacity>
            <MaterialCommunityIcons
              name="cards-heart-outline"
              size={22}
              color="#F87171"
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const SectionHeader: React.FC<{
  title: string;
  onSeeAll?: () => void;
}> = ({ title, onSeeAll }) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        marginHorizontal: 16,
      }}
    >
      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{title}</Text>
      <TouchableOpacity onPress={onSeeAll}>
        <Text style={{ color: '#7c3aed', fontWeight: '600' }}>See all</Text>
      </TouchableOpacity>
    </View>
  );
};

const LoadingIndicator: React.FC = () => (
  <View className="py-8 items-center">
    <ActivityIndicator size="large" color="#7c3aed" />
  </View>
);

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { getAllUserCourses } = useCourseService();
  const { getAllServices } = useServicesService();
  const dispatch = useDispatch();
  const [courses, setCourses] = useState<Course[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [continueCourse, setContinueCourse] = useState<Course | null>(null);
 
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [servicesLoading, setServicesLoading] = useState(false);
  const { getUserDetails } = useUsersService();
  const [coursesPage] = useState(1);
  const [servicesPage] = useState(1);
  const coursesLimit = 10;
  const servicesLimit = 10;

  const fetchCourses = useCallback(async () => {
    try {
      setCoursesLoading(true);
      const response = await getAllUserCourses(
        coursesPage,
        coursesLimit,
        'createdAt',
        'DESC',
      );

      console.log('Course API Response:', response);

      // Handle different possible response structures
      let courseData: Course[] = [];

      if (Array.isArray(response)) {
        courseData = response;
      } else if (response?.data) {
        if (Array.isArray(response.data)) {
          courseData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          courseData = response.data.data;
        } else if (
          response.data.courses &&
          Array.isArray(response.data.courses)
        ) {
          courseData = response.data.courses;
        }
      }

      console.log('Parsed course data:', courseData);

      if (courseData.length > 0) {
        setCourses(courseData);

        // Find ongoing course
        const ongoingCourse = courseData.find(
          c => c.progress && c.progress > 0,
        );
        if (ongoingCourse) {
          setContinueCourse(ongoingCourse);
        }
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setCoursesLoading(false);
    }
  }, [getAllUserCourses, coursesPage, coursesLimit]);

  const fetchServices = useCallback(async () => {
    try {
      setServicesLoading(true);
      const response = await getAllServices(
        servicesPage,
        servicesLimit,
        'createdAt',
        'DESC',
        '',
      );

      console.log('Service API Response:', response);

      // Handle different possible response structures
      let serviceData: Service[] = [];

      if (Array.isArray(response)) {
        serviceData = response;
      } else if (response?.data) {
        if (Array.isArray(response.data)) {
          serviceData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          serviceData = response.data.data;
        } else if (
          response.data.services &&
          Array.isArray(response.data.services)
        ) {
          serviceData = response.data.services;
        }
      }

      console.log('Parsed service data:', serviceData);

      if (serviceData.length > 0) {
        setServices(serviceData);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setServicesLoading(false);
    }
  }, [getAllServices, servicesPage, servicesLimit]);

  const fetchUserDetails = async () => {
    try {
      const response = await getUserDetails();
      dispatch(
        setUserDetails({
          ...response,
          firstName: response?.fullName?.split(' ')[0] || '',
          lastName: response?.fullName?.split(' ')[1] || '',
          location: response?.location,
          languages: response?.languages || [{ name: '', proficiency: '' }],
          education: response?.educations?.length
            ? response.educations
            : [
                {
                  institute: '',
                  areaOfStudy: '',
                  startDate: null,
                  endDate: null,
                },
              ],
          experience: response?.experiences?.length
            ? response.experiences
            : [
                {
                  company: '',
                  title: '',
                  startDate: null,
                  endDate: null,
                },
              ],
          certification: response?.certifications?.length
            ? response.certifications
            : [
                {
                  certificationName: '',
                  institute: '',
                  startDate: null,
                  endDate: null,
                },
              ],
        }),
      );
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed',
        text2: 'Fetching profile failed',
      });
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchServices();
    fetchUserDetails();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Header />
        <SearchBar />
        <Categories />

        {continueCourse && (
          <>
            <SectionHeader
              title="Continue Your courses"
              onSeeAll={() => navigation.navigate('BrowseCourseScreen')}
            />
            <ContinueCourseCard course={continueCourse} />
          </>
        )}

        <SectionHeader
          title="Recommendation Course"
          onSeeAll={() => navigation.navigate('BrowseCourseScreen')}
        />
        {coursesLoading ? (
          <LoadingIndicator />
        ) : courses.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-6"
            contentContainerStyle={{ paddingLeft: 16, paddingRight: 16 }}
          >
            {courses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </ScrollView>
        ) : (
          <View className="px-5 mb-6 py-8">
            <Text className="text-gray-500 text-center">
              No courses available
            </Text>
          </View>
        )}

        <SectionHeader title="Recommendation Services" />
        {servicesLoading ? (
          <LoadingIndicator />
        ) : services.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-6"
            contentContainerStyle={{ paddingLeft: 16, paddingRight: 16 }}
          >
            {services.map(service => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </ScrollView>
        ) : (
          <View className="px-5 mb-6 py-8">
            <Text className="text-gray-500 text-center">
              No services available
            </Text>
          </View>
        )}

        <View className="h-4" />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  gradientCard: {
    borderRadius: 24,
    padding: 20,
    overflow: 'hidden',
  },
  card: {
    width: 288,
    marginRight: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  strikethrough: {
    fontSize: 14,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    textDecorationStyle: 'solid',
  },
});

export default HomeScreen;
