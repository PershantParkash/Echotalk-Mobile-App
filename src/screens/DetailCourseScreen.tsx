// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   Image,
//   ScrollView,
//   TouchableOpacity,
//   SafeAreaView,
//   ActivityIndicator,
//   Modal,
// } from 'react-native';
// import {
//   ArrowLeft,
//   Share2,
//   ShoppingCart,
//   Play,
//   Heart,
//   Users,
//   BookOpen,
//   Award,
//   CheckCircle2,
// } from 'lucide-react-native';
// import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
// import { NativeStackNavigationProp } from '@react-navigation/native-stack';
// import useCourseService from '../services/course';
// import { RootStackParamList } from '../navigation/navigation';

// interface Module {
//   id: number;
//   title: string;
//   duration: string;
//   completed: boolean;
// }

// interface Lesson {
//   id: number;
//   title: string;
//   duration: number;
// }

// interface Chapter {
//   id: number;
//   title: string;
//   lessons: Lesson[];
// }

// interface Trainer {
//   id: number;
//   fullName: string;
//   profileImage: string;
//   bio?: string;
//   title?: string;
// }

// interface Course {
//   id: number;
//   title: string;
//   description: string;
//   price: number;
//   discount: number;
//   rating: number;
//   ratingCount: number;
//   thumbnail: string;
//   previewVideoUrl: string;
//   lessons: number;
//   assignments: boolean;
//   updatedAt: string;
//   requirements: string;
//   whatYouLearn: string[];
//   chapters: Chapter[];
//   trainer: Trainer;
//   level?: string;
// }

// interface Review {
//   id: number;
//   userName: string;
//   rating: number;
//   comment: string;
//   date: string;
// }

// type TabType = 'Details' | 'Modules' | 'Reviews';

// type DetailCourseScreenRouteProp = RouteProp<
//   RootStackParamList,
//   'DetailCourseScreen'
// >;
// type DetailCourseScreenNavigationProp = NativeStackNavigationProp<
//   RootStackParamList,
//   'DetailCourseScreen'
// >;

// const DetailCourseScreen: React.FC = () => {
//   const route = useRoute<DetailCourseScreenRouteProp>();
//   const navigation = useNavigation<DetailCourseScreenNavigationProp>();
//   const { getCourseDetails } = useCourseService();

//   const { courseId } = route.params;

//   const [activeTab, setActiveTab] = useState<TabType>('Details');
//   const [isFavorite, setIsFavorite] = useState(false);
//   const [showFullDescription, setShowFullDescription] = useState(false);
//   const [course, setCourse] = useState<Course | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [openModal, setOpenModal] = useState(false);

//   // Mock reviews (you can add these to your API later)
//   const reviews: Review[] = [
//     {
//       id: 1,
//       userName: 'Sarah Johnson',
//       rating: 5,
//       comment: 'Excellent course! Very clear explanations.',
//       date: '2 days ago',
//     },
//     {
//       id: 2,
//       userName: 'Mike Chen',
//       rating: 5,
//       comment: 'Great instructor and well-structured content.',
//       date: '1 week ago',
//     },
//   ];

//   useEffect(() => {
//     fetchCourseDetails();
//   }, [courseId]);

//   const fetchCourseDetails = async () => {
//     try {
//       setLoading(true);
//       setError(null);
//       const response = await getCourseDetails(courseId);
//       setCourse(response);
//     } catch (err) {
//       console.error('Error fetching course details:', err);
//       setError('Failed to load course details. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const formatTime = (seconds: number): string => {
//     const minutes = Math.floor(seconds / 60);
//     const remainingSeconds = Math.floor(seconds % 60);

//     const hours = Math.floor(minutes / 60);
//     const remainingMinutes = Math.floor(minutes % 60);

//     let timeString = '';

//     if (hours > 0) {
//       timeString += `${hours} hour${hours > 1 ? 's' : ''} `;
//     }

//     if (remainingMinutes > 0) {
//       timeString += `${remainingMinutes} minute${
//         remainingMinutes > 1 ? 's' : ''
//       } `;
//     }

//     if (remainingSeconds > 0 && hours === 0) {
//       // Only include seconds if it's less than an hour
//       timeString += `${remainingSeconds} second${
//         remainingSeconds > 1 ? 's' : ''
//       }`;
//     }

//     return timeString.trim() || '0 seconds';
//   };
//   const calculateTotalDuration = (): number => {
//     if (!course?.chapters) return 0;

//     return course.chapters.reduce((chapterAcc, chapter) => {
//       const chapterDuration = chapter.lessons.reduce((lessonAcc, lesson) => {
//         return lessonAcc + (lesson.duration || 0);
//       }, 0);
//       return chapterAcc + chapterDuration;
//     }, 0);
//   };

//   const renderStars = (rating: number) => {
//     return (
//       <View className="flex-row gap-1">
//         {[1, 2, 3, 4, 5].map(star => (
//           <Text key={star} className="text-yellow-400 text-sm">
//             {star <= rating ? '★' : '☆'}
//           </Text>
//         ))}
//       </View>
//     );
//   };

//   const renderTabContent = () => {
//     if (!course) return null;

//     switch (activeTab) {
//       case 'Details':
//         return (
//           <View className="px-5 pb-6">
//             <Text className="text-lg font-bold text-gray-900 mb-3">
//               About Course
//             </Text>
//             <Text className="text-gray-600 text-base leading-6 mb-2">
//               {showFullDescription
//                 ? course.description.replace(/<[^>]*>/g, '') // Strip HTML tags
//                 : course.description.replace(/<[^>]*>/g, '').substring(0, 200) +
//                   '...'}
//             </Text>
//             <TouchableOpacity
//               onPress={() => setShowFullDescription(!showFullDescription)}
//             >
//               <Text className="text-purple-600 font-semibold text-base">
//                 {showFullDescription ? 'Read Less...' : 'Read More...'}
//               </Text>
//             </TouchableOpacity>

//             <Text className="text-lg font-bold text-gray-900 mt-6 mb-3">
//               What you'll learn
//             </Text>
//             {course.whatYouLearn?.slice(0, 4).map((item, index) => (
//               <View key={index} className="flex-row items-start mb-3">
//                 <CheckCircle2 size={20} color="#8B5CF6" className="mt-0.5" />
//                 <Text className="text-gray-700 text-base ml-3 flex-1">
//                   {item}
//                 </Text>
//               </View>
//             ))}

//             <Text className="text-lg font-bold text-gray-900 mt-6 mb-3">
//               Requirements
//             </Text>
//             <Text className="text-gray-600 text-base leading-6">
//               {course.requirements}
//             </Text>

//             <Text className="text-lg font-bold text-gray-900 mt-6 mb-3">
//               Mentor
//             </Text>
//             <View className="flex-row items-center justify-between bg-white rounded-2xl p-4 shadow-sm">
//               <View className="flex-row items-center flex-1">
//                 <Image
//                   source={{
//                     uri:
//                       course.trainer?.profileImage ||
//                       'https://i.pravatar.cc/100?img=1',
//                   }}
//                   className="w-12 h-12 rounded-full"
//                 />
//                 <View className="ml-3 flex-1">
//                   <Text className="text-base font-bold text-gray-900">
//                     {course.trainer?.fullName || 'Unknown Trainer'}
//                   </Text>
//                   <Text className="text-sm text-gray-500">
//                     {course.trainer?.title || 'Instructor'}
//                   </Text>
//                 </View>
//               </View>
//               <TouchableOpacity className="border border-purple-600 rounded-full px-4 py-2">
//                 <Text className="text-purple-600 font-semibold text-sm">
//                   See Profile
//                 </Text>
//               </TouchableOpacity>
//             </View>

//             {course.trainer?.bio && (
//               <>
//                 <Text className="text-gray-600 text-base leading-6 mt-4">
//                   {course.trainer.bio}
//                 </Text>
//                 <TouchableOpacity>
//                   <Text className="text-purple-600 font-semibold text-base mt-2">
//                     Read More...
//                   </Text>
//                 </TouchableOpacity>
//               </>
//             )}
//           </View>
//         );

//       case 'Modules':
//         return (
//           <View className="px-5 pb-6">
//             {course.chapters?.map((chapter, chapterIndex) => (
//               <View key={chapter.id} className="mb-4">
//                 <View className="bg-gray-100 rounded-xl p-4 mb-2">
//                   <Text className="text-gray-900 font-bold text-base mb-1">
//                     {chapter.title}
//                   </Text>
//                   <Text className="text-gray-500 text-sm">
//                     {chapter.lessons.length} Lessons
//                   </Text>
//                 </View>

//                 {chapter.lessons.map((lesson, lessonIndex) => (
//                   <View
//                     key={lesson.id}
//                     className="bg-white rounded-xl p-4 mb-2 ml-4 shadow-sm flex-row items-center"
//                   >
//                     <View className="w-8 h-8 bg-purple-100 rounded-full items-center justify-center">
//                       <Text className="text-purple-600 font-bold text-xs">
//                         {lessonIndex + 1}
//                       </Text>
//                     </View>
//                     <View className="flex-1 ml-3">
//                       <Text className="text-gray-900 font-semibold text-sm">
//                         {lesson.title}
//                       </Text>
//                       <Text className="text-gray-500 text-xs mt-1">
//                         {formatTime(lesson.duration)}
//                       </Text>
//                     </View>
//                   </View>
//                 ))}
//               </View>
//             ))}
//           </View>
//         );

//       case 'Reviews':
//         return (
//           <View className="px-5 pb-6">
//             <View className="flex-row items-center justify-between mb-6">
//               <View>
//                 <Text className="text-4xl font-bold text-gray-900">
//                   {course.rating.toFixed(1)}
//                 </Text>
//                 {renderStars(Math.round(course.rating))}
//                 <Text className="text-gray-500 text-sm mt-1">
//                   ({course.ratingCount} reviews)
//                 </Text>
//               </View>
//             </View>

//             {reviews.map(review => (
//               <View
//                 key={review.id}
//                 className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
//               >
//                 <View className="flex-row items-center justify-between mb-2">
//                   <View className="flex-row items-center">
//                     <Image
//                       source={{
//                         uri: `https://i.pravatar.cc/100?img=${review.id}`,
//                       }}
//                       className="w-10 h-10 rounded-full"
//                     />
//                     <View className="ml-3">
//                       <Text className="text-gray-900 font-semibold">
//                         {review.userName}
//                       </Text>
//                       <Text className="text-gray-500 text-xs">
//                         {review.date}
//                       </Text>
//                     </View>
//                   </View>
//                   {renderStars(review.rating)}
//                 </View>
//                 <Text className="text-gray-600 text-base">
//                   {review.comment}
//                 </Text>
//               </View>
//             ))}
//           </View>
//         );
//     }
//   };

//   if (loading) {
//     return (
//       <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
//         <ActivityIndicator size="large" color="#9333EA" />
//         <Text className="text-gray-500 mt-4">Loading course details...</Text>
//       </SafeAreaView>
//     );
//   }

//   if (error || !course) {
//     return (
//       <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center px-5">
//         <Text className="text-gray-900 text-lg font-bold mb-2">Oops!</Text>
//         <Text className="text-gray-600 text-center mb-4">
//           {error || 'Course not found'}
//         </Text>
//         <TouchableOpacity
//           onPress={() => navigation.goBack()}
//           className="bg-purple-600 rounded-full px-6 py-3"
//         >
//           <Text className="text-white font-semibold">Go Back</Text>
//         </TouchableOpacity>
//       </SafeAreaView>
//     );
//   }

//   const totalDuration = calculateTotalDuration();

//   return (
//     <SafeAreaView className="flex-1 bg-gray-50">
//       <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
//         {/* Header */}
//         <View className="px-5 pt-4 pb-2 flex-row items-center justify-between">
//           <TouchableOpacity
//             onPress={() => navigation.goBack()}
//             className="w-10 h-10 items-center justify-center"
//           >
//             <ArrowLeft size={24} color="#1F2937" />
//           </TouchableOpacity>
//           <View className="flex-row gap-3">
//             <TouchableOpacity className="w-10 h-10 items-center justify-center">
//               <Share2 size={22} color="#1F2937" />
//             </TouchableOpacity>
//             <TouchableOpacity className="w-10 h-10 items-center justify-center">
//               <ShoppingCart size={22} color="#1F2937" />
//             </TouchableOpacity>
//           </View>
//         </View>

//         {/* Video Thumbnail */}
//         <View className="px-5 py-4">
//           <View className="bg-gray-200 rounded-3xl overflow-hidden h-48 relative">
//             <Image
//               source={{
//                 uri:
//                   course.thumbnail ||
//                   'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800',
//               }}
//               className="w-full h-full"
//               resizeMode="cover"
//             />
//             <View className="absolute inset-0 items-center justify-center">
//               <TouchableOpacity
//                 onPress={() => setOpenModal(true)}
//                 className="w-16 h-16 bg-purple-600 rounded-full items-center justify-center shadow-lg"
//               >
//                 <Play
//                   size={28}
//                   color="white"
//                   fill="white"
//                   style={{ marginLeft: 4 }}
//                 />
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>

//         {/* Video Preview Modal */}
//         <Modal
//           visible={openModal}
//           animationType="fade"
//           transparent={true}
//           onRequestClose={() => setOpenModal(false)}
//         >
//           <View className="flex-1 bg-black/90 items-center justify-center">
//             <TouchableOpacity
//               onPress={() => setOpenModal(false)}
//               className="absolute top-12 right-5 z-10"
//             >
//               <Text className="text-white text-2xl font-bold">✕</Text>
//             </TouchableOpacity>
//             {/* Note: You'll need to use a video component here like react-native-video */}
//             <Text className="text-white">Video player would go here</Text>
//             <Text className="text-gray-400 text-sm mt-2">
//               {course.previewVideoUrl}
//             </Text>
//           </View>
//         </Modal>

//         {/* Course Info */}
//         <View className="px-5">
//           <View className="flex-row items-start justify-between mb-3">
//             <Text className="text-2xl font-bold text-gray-900 flex-1 mr-3">
//               {course.title}
//             </Text>
//             <TouchableOpacity
//               onPress={() => setIsFavorite(!isFavorite)}
//               className="w-10 h-10 items-center justify-center"
//             >
//               <Heart
//                 size={24}
//                 color={isFavorite ? '#EF4444' : '#9CA3AF'}
//                 fill={isFavorite ? '#EF4444' : 'none'}
//               />
//             </TouchableOpacity>
//           </View>

//           <View className="flex-row items-center mb-4">
//             {renderStars(Math.round(course.rating))}
//             <Text className="text-gray-600 text-sm ml-2">
//               ({course.ratingCount})
//             </Text>
//             {course.level && (
//               <View className="flex-row items-center ml-4">
//                 <Text className="text-purple-600 text-sm font-semibold">
//                   {course.level}
//                 </Text>
//               </View>
//             )}
//           </View>

//           <View className="flex-row items-center mb-2">
//             <Text className="text-3xl font-bold text-gray-900">
//               ${course.discount}
//             </Text>
//             <Text className="text-gray-400 text-xl ml-3 line-through">
//               ${course.price}
//             </Text>
//           </View>

//           <Text className="text-gray-500 text-sm mb-4">
//             Created by {course.trainer?.fullName || 'Unknown'}
//           </Text>

//           <View className="flex-row items-center gap-4 mb-6 flex-wrap">
//             <View className="flex-row items-center">
//               <Users size={16} color="#6B7280" />
//               <Text className="text-gray-600 text-sm ml-1">
//                 {course.ratingCount} Students
//               </Text>
//             </View>
//             <View className="flex-row items-center">
//               <BookOpen size={16} color="#6B7280" />
//               <Text className="text-gray-600 text-sm ml-1">
//                 {course.lessons} Lessons
//               </Text>
//             </View>
//             <View className="flex-row items-center">
//               <BookOpen size={16} color="#6B7280" />
//               <Text className="text-gray-600 text-sm ml-1">
//                 {formatTime(totalDuration)}
//               </Text>
//             </View>
//             <View className="flex-row items-center">
//               <Award size={16} color="#6B7280" />
//               <Text className="text-gray-600 text-sm ml-1">Certificate</Text>
//             </View>
//           </View>

//           {/* Tabs */}
//           <View className="flex-row border-b border-gray-200 mb-6">
//             {(['Details', 'Modules', 'Reviews'] as TabType[]).map(tab => (
//               <TouchableOpacity
//                 key={tab}
//                 onPress={() => setActiveTab(tab)}
//                 className={`flex-1 pb-3 items-center ${
//                   activeTab === tab ? 'border-b-2 border-purple-600' : ''
//                 }`}
//               >
//                 <Text
//                   className={`text-base font-semibold ${
//                     activeTab === tab ? 'text-purple-600' : 'text-gray-400'
//                   }`}
//                 >
//                   {tab}
//                 </Text>
//               </TouchableOpacity>
//             ))}
//           </View>
//         </View>

//         {/* Tab Content */}
//         {renderTabContent()}
//       </ScrollView>

//       {/* Bottom CTA */}
//       <View className="px-5 py-4 bg-white border-t border-gray-200">
//         <View className="flex-row gap-3">
//           <TouchableOpacity className="flex-1 bg-white border-2 border-purple-600 rounded-full py-4 items-center">
//             <Text className="text-purple-600 font-bold text-base">
//               Add to Cart
//             </Text>
//           </TouchableOpacity>
//           <TouchableOpacity className="flex-1 bg-purple-600 rounded-full py-4 items-center shadow-lg">
//             <Text className="text-white font-bold text-base">
//               Buy Now ${course.discount}
//             </Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     </SafeAreaView>
//   );
// };

// export default DetailCourseScreen;
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import {
  ArrowLeft,
  Share2,
  ShoppingCart,
  Play,
  Heart,
  Users,
  BookOpen,
  Award,
  CheckCircle2,
} from 'lucide-react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import useCourseService from '../services/course';
import { RootStackParamList } from '../navigation/navigation';

interface Module {
  id: number;
  title: string;
  duration: string;
  completed: boolean;
}

interface Lesson {
  id: number;
  title: string;
  duration: number;
}

interface Chapter {
  id: number;
  title: string;
  lessons: Lesson[];
}

interface Trainer {
  id: number;
  fullName: string;
  profileImage: string;
  bio?: string;
  title?: string;
}

interface Course {
  id: number;
  title: string;
  description: string;
  price: number;
  discount: number;
  rating: number;
  ratingCount: number;
  thumbnail: string;
  previewVideoUrl: string;
  lessons: number;
  assignments: boolean;
  updatedAt: string;
  requirements: string;
  whatYouLearn: string[];
  chapters: Chapter[];
  trainer: Trainer;
  level?: string;
}

interface Review {
  id: number;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

type TabType = 'Details' | 'Modules' | 'Reviews';

type DetailCourseScreenRouteProp = RouteProp<
  RootStackParamList,
  'DetailCourseScreen'
>;
type DetailCourseScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'DetailCourseScreen'
>;

const DetailCourseScreen: React.FC = () => {
  const route = useRoute<DetailCourseScreenRouteProp>();
  const navigation = useNavigation<DetailCourseScreenNavigationProp>();
  const { getCourseDetails } = useCourseService();

  const { courseId } = route.params;

  const [activeTab, setActiveTab] = useState<TabType>('Details');
  const [isFavorite, setIsFavorite] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState(false);

  // Mock reviews (you can add these to your API later)
  const reviews: Review[] = [
    {
      id: 1,
      userName: 'Sarah Johnson',
      rating: 5,
      comment: 'Excellent course! Very clear explanations.',
      date: '2 days ago',
    },
    {
      id: 2,
      userName: 'Mike Chen',
      rating: 5,
      comment: 'Great instructor and well-structured content.',
      date: '1 week ago',
    },
  ];

  useEffect(() => {
    fetchCourseDetails();
  }, [courseId]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCourseDetails(courseId);
      setCourse(response);
    } catch (err) {
      console.error('Error fetching course details:', err);
      setError('Failed to load course details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.floor(minutes % 60);

    let timeString = '';

    if (hours > 0) {
      timeString += `${hours} hour${hours > 1 ? 's' : ''} `;
    }

    if (remainingMinutes > 0) {
      timeString += `${remainingMinutes} minute${
        remainingMinutes > 1 ? 's' : ''
      } `;
    }

    if (remainingSeconds > 0 && hours === 0) {
      // Only include seconds if it's less than an hour
      timeString += `${remainingSeconds} second${
        remainingSeconds > 1 ? 's' : ''
      }`;
    }

    return timeString.trim() || '0 seconds';
  };
  
  const calculateTotalDuration = (): number => {
    if (!course?.chapters) return 0;

    return course.chapters.reduce((chapterAcc, chapter) => {
      const chapterDuration = chapter.lessons.reduce((lessonAcc, lesson) => {
        return lessonAcc + (lesson.duration || 0);
      }, 0);
      return chapterAcc + chapterDuration;
    }, 0);
  };

  const renderStars = (rating: number) => {
    return (
      <View className="flex-row gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Text key={star} className="text-yellow-400 text-sm">
            {star <= rating ? '★' : '☆'}
          </Text>
        ))}
      </View>
    );
  };

  const renderTabContent = () => {
    if (!course) return null;

    switch (activeTab) {
      case 'Details':
        return (
          <View className="px-5 pb-6">
            <Text className="text-lg font-bold text-gray-900 mb-3">
              About Course
            </Text>
            <Text className="text-gray-600 text-base leading-6 mb-2">
              {showFullDescription
                ? course.description.replace(/<[^>]*>/g, '') // Strip HTML tags
                : course.description.replace(/<[^>]*>/g, '').substring(0, 200) +
                  '...'}
            </Text>
            <TouchableOpacity
              onPress={() => setShowFullDescription(!showFullDescription)}
            >
              <Text className="text-purple-600 font-semibold text-base">
                {showFullDescription ? 'Read Less...' : 'Read More...'}
              </Text>
            </TouchableOpacity>

            <Text className="text-lg font-bold text-gray-900 mt-6 mb-3">
              What you'll learn
            </Text>
            {course.whatYouLearn?.slice(0, 4).map((item, index) => (
              <View key={index} className="flex-row items-start mb-3">
                <CheckCircle2 size={20} color="#8B5CF6" className="mt-0.5" />
                <Text className="text-gray-700 text-base ml-3 flex-1">
                  {item}
                </Text>
              </View>
            ))}

            <Text className="text-lg font-bold text-gray-900 mt-6 mb-3">
              Requirements
            </Text>
            <Text className="text-gray-600 text-base leading-6">
              {course.requirements}
            </Text>

            <Text className="text-lg font-bold text-gray-900 mt-6 mb-3">
              Mentor
            </Text>
            <View className="flex-row items-center justify-between bg-white rounded-2xl p-4 shadow-sm">
              <View className="flex-row items-center flex-1">
                <Image
                  source={{
                    uri:
                      course.trainer?.profileImage ||
                      'https://i.pravatar.cc/100?img=1',
                  }}
                  className="w-12 h-12 rounded-full"
                />
                <View className="ml-3 flex-1">
                  <Text className="text-base font-bold text-gray-900">
                    {course.trainer?.fullName || 'Unknown Trainer'}
                  </Text>
                  <Text className="text-sm text-gray-500">
                    {course.trainer?.title || 'Instructor'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity className="border border-purple-600 rounded-full px-4 py-2">
                <Text className="text-purple-600 font-semibold text-sm">
                  See Profile
                </Text>
              </TouchableOpacity>
            </View>

            {course.trainer?.bio && (
              <>
                <Text className="text-gray-600 text-base leading-6 mt-4">
                  {course.trainer.bio}
                </Text>
                <TouchableOpacity>
                  <Text className="text-purple-600 font-semibold text-base mt-2">
                    Read More...
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        );

      case 'Modules':
        return (
          <View className="px-5 pb-6">
            {course.chapters?.map((chapter, chapterIndex) => (
              <View key={chapter.id} className="mb-4">
                <View className="bg-gray-100 rounded-xl p-4 mb-2">
                  <Text className="text-gray-900 font-bold text-base mb-1">
                    {chapter.title}
                  </Text>
                  <Text className="text-gray-500 text-sm">
                    {chapter.lessons.length} Lessons
                  </Text>
                </View>

                {chapter.lessons.map((lesson, lessonIndex) => (
                  <View
                    key={lesson.id}
                    className="bg-white rounded-xl p-4 mb-2 ml-4 shadow-sm flex-row items-center"
                  >
                    <View className="w-8 h-8 bg-purple-100 rounded-full items-center justify-center">
                      <Text className="text-purple-600 font-bold text-xs">
                        {lessonIndex + 1}
                      </Text>
                    </View>
                    <View className="flex-1 ml-3">
                      <Text className="text-gray-900 font-semibold text-sm">
                        {lesson.title}
                      </Text>
                      <Text className="text-gray-500 text-xs mt-1">
                        {formatTime(lesson.duration)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </View>
        );

      case 'Reviews':
        return (
          <View className="px-5 pb-6">
            <View className="flex-row items-center justify-between mb-6">
              <View>
                <Text className="text-4xl font-bold text-gray-900">
                  {course?.rating ? course.rating.toFixed(1) : '0.0'}
                </Text>
                {renderStars(Math.round(course?.rating || 0))}
                <Text className="text-gray-500 text-sm mt-1">
                  ({course?.ratingCount || 0} reviews)
                </Text>
              </View>
            </View>

            {reviews.map(review => (
              <View
                key={review.id}
                className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center">
                    <Image
                      source={{
                        uri: `https://i.pravatar.cc/100?img=${review.id}`,
                      }}
                      className="w-10 h-10 rounded-full"
                    />
                    <View className="ml-3">
                      <Text className="text-gray-900 font-semibold">
                        {review.userName}
                      </Text>
                      <Text className="text-gray-500 text-xs">
                        {review.date}
                      </Text>
                    </View>
                  </View>
                  {renderStars(review.rating)}
                </View>
                <Text className="text-gray-600 text-base">
                  {review.comment}
                </Text>
              </View>
            ))}
          </View>
        );
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#9333EA" />
        <Text className="text-gray-500 mt-4">Loading course details...</Text>
      </SafeAreaView>
    );
  }

  if (error || !course) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center px-5">
        <Text className="text-gray-900 text-lg font-bold mb-2">Oops!</Text>
        <Text className="text-gray-600 text-center mb-4">
          {error || 'Course not found'}
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="bg-purple-600 rounded-full px-6 py-3"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const totalDuration = calculateTotalDuration();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-5 pt-4 pb-2 flex-row items-center justify-between">
          <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => navigation.goBack()}
                    >
                      <Image
                        source={require('../assets/Badges Arrow.png')}
                        className="w-10 h-10"
                        resizeMode="contain"
                      />
                    </TouchableOpacity>
          <View className="flex-row gap-3">
            <TouchableOpacity className="w-10 h-10 items-center justify-center">
              <Share2 size={22} color="#1F2937" />
            </TouchableOpacity>
            <TouchableOpacity className="w-10 h-10 items-center justify-center">
              <ShoppingCart size={22} color="#1F2937" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Video Thumbnail */}
        <View className="px-5 py-4">
          <View className="bg-gray-200 rounded-3xl overflow-hidden h-48 relative">
            <Image
              source={{
                uri:
                  course.thumbnail ||
                  'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800',
              }}
              className="w-full h-full"
              resizeMode="cover"
            />
            <View className="absolute inset-0 items-center justify-center">
              <TouchableOpacity
                onPress={() => setOpenModal(true)}
                className="w-16 h-16 bg-purple-600 rounded-full items-center justify-center shadow-lg"
              >
                <Play
                  size={28}
                  color="white"
                  fill="white"
                  style={{ marginLeft: 4 }}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Video Preview Modal */}
        <Modal
          visible={openModal}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setOpenModal(false)}
        >
          <View className="flex-1 bg-black/90 items-center justify-center">
            <TouchableOpacity
              onPress={() => setOpenModal(false)}
              className="absolute top-12 right-5 z-10"
            >
              <Text className="text-white text-2xl font-bold">✕</Text>
            </TouchableOpacity>
            {/* Note: You'll need to use a video component here like react-native-video */}
            <Text className="text-white">Video player would go here</Text>
            <Text className="text-gray-400 text-sm mt-2">
              {course.previewVideoUrl}
            </Text>
          </View>
        </Modal>

        {/* Course Info */}
        <View className="px-5">
          <View className="flex-row items-start justify-between mb-3">
            <Text className="text-2xl font-bold text-gray-900 flex-1 mr-3">
              {course.title}
            </Text>
            <TouchableOpacity
              onPress={() => setIsFavorite(!isFavorite)}
              className="w-10 h-10 items-center justify-center"
            >
              <Heart
                size={24}
                color={isFavorite ? '#EF4444' : '#9CA3AF'}
                fill={isFavorite ? '#EF4444' : 'none'}
              />
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center mb-4">
            {renderStars(Math.round(course?.rating || 0))}
            <Text className="text-gray-600 text-sm ml-2">
              ({course?.ratingCount || 0})
            </Text>
            {course.level && (
              <View className="flex-row items-center ml-4">
                <Text className="text-purple-600 text-sm font-semibold">
                  {course.level}
                </Text>
              </View>
            )}
          </View>

          <View className="flex-row items-center mb-2">
            <Text className="text-3xl font-bold text-gray-900">
              ${course.discount}
            </Text>
            <Text className="text-gray-400 text-xl ml-3 line-through">
              ${course.price}
            </Text>
          </View>

          <Text className="text-gray-500 text-sm mb-4">
            Created by {course.trainer?.fullName || 'Unknown'}
          </Text>

          <View className="flex-row items-center gap-4 mb-6 flex-wrap">
            <View className="flex-row items-center">
              <Users size={16} color="#6B7280" />
              <Text className="text-gray-600 text-sm ml-1">
                {course?.ratingCount || 0} Students
              </Text>
            </View>
            <View className="flex-row items-center">
              <BookOpen size={16} color="#6B7280" />
              <Text className="text-gray-600 text-sm ml-1">
                {course?.lessons || 0} Lessons
              </Text>
            </View>
            <View className="flex-row items-center">
              <BookOpen size={16} color="#6B7280" />
              <Text className="text-gray-600 text-sm ml-1">
                {formatTime(totalDuration)}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Award size={16} color="#6B7280" />
              <Text className="text-gray-600 text-sm ml-1">Certificate</Text>
            </View>
          </View>

          {/* Tabs */}
          <View className="flex-row border-b border-gray-200 mb-6">
            {(['Details', 'Modules', 'Reviews'] as TabType[]).map(tab => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                className={`flex-1 pb-3 items-center ${
                  activeTab === tab ? 'border-b-2 border-purple-600' : ''
                }`}
              >
                <Text
                  className={`text-base font-semibold ${
                    activeTab === tab ? 'text-purple-600' : 'text-gray-400'
                  }`}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tab Content */}
        {renderTabContent()}
      </ScrollView>

      {/* Bottom CTA */}
      <View className="px-5 py-4 bg-white border-t border-gray-200">
        <View className="flex-row gap-3">
          <TouchableOpacity className="flex-1 bg-white border-2 border-purple-600 rounded-full py-4 items-center">
            <Text className="text-purple-600 font-bold text-base">
              Add to Cart
            </Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-1 bg-purple-600 rounded-full py-4 items-center shadow-lg">
            <Text className="text-white font-bold text-base">
              Buy Now ${course.discount}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default DetailCourseScreen;