
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Play, Heart, Star, Filter, X } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import useCourseService from '../services/course';
import { RootStackParamList } from '../navigation/navigation';

// Types
interface Course {
  id: number;
  title: string;
  instructor: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviews: number;
  modules: number;
  image: string;
  thumbnail: string;
  level?: string;
}

interface CourseCardProps {
  course: Course;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  onPress: () => void;
}

interface FilterSidebarProps {
  visible: boolean;
  onClose: () => void;
  selectedRatings: number[];
  onChangeRatings: (ratings: number[]) => void;
  selectedPrices: number[][];
  onChangePrices: (prices: number[][]) => void;
  selectedLevels: string[];
  onChangeLevels: (levels: string[]) => void;
}

type CourseExploreNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// CourseCard Component
const CourseCard: React.FC<CourseCardProps> = ({ 
  course, 
  isFavorited, 
  onToggleFavorite,
  onPress 
}) => {
  return (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.7}
      className="flex-row bg-white rounded-2xl p-4 mb-4 shadow-md"
    >
      {/* Course Image */}
      <View className="relative">
        <Image
          source={{ uri: course?.thumbnail || "/images/courses/no-course-thumbnail.jpg" }}
          className="w-24 h-24 rounded-xl"
          resizeMode="cover"
        />
        {/* Play Button Overlay */}
        <View className="absolute inset-0 items-center justify-center">
          <View className="bg-purple-600 w-12 h-12 rounded-full items-center justify-center shadow-lg">
            <Play size={20} color="white" fill="white" style={{ marginLeft: 2 }} />
          </View>
        </View>
      </View>

      {/* Course Info */}
      <View className="flex-1 ml-4 justify-between">
        <View>
          <Text className="text-gray-900 font-bold text-base mb-1">
            {course.title}
          </Text>
          <Text className="text-gray-500 text-sm mb-2">
            {course.instructor}
          </Text>
          
          {/* Price */}
          <View className="flex-row items-center mb-2">
            <Text className="text-purple-600 font-bold text-lg">
              ${course.price}
            </Text>
            <Text className="text-gray-400 text-sm ml-2 line-through">
              ${course.originalPrice}
            </Text>
          </View>

          {/* Rating */}
          <View className="flex-row items-center">
            <Text className="text-gray-900 font-semibold text-sm mr-2">
              {Number(course.rating).toFixed(2)}
            </Text>
            <View className="flex-row">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={12}
                  color="#FFA500"
                  fill="#FFA500"
                  style={{ marginRight: 2 }}
                />
              ))}
            </View>
            <Text className="text-gray-400 text-xs ml-1">
              ({course.reviews})
            </Text>
          </View>
        </View>
      </View>

      {/* Right Side - Modules & Favorite */}
      <View className="items-end justify-between ml-2">
        <Text className="text-purple-600 text-xs font-medium">
          {course.modules} module
        </Text>
        
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation(); // Prevent navigation when tapping favorite
            onToggleFavorite();
          }}
          className="mt-2"
          activeOpacity={0.7}
        >
          <Heart
            size={24}
            color={isFavorited ? "#FF6B9D" : "#FFB8D2"}
            fill={isFavorited ? "#FF6B9D" : "transparent"}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

// FilterSidebar Component
const FilterSidebar: React.FC<FilterSidebarProps> = ({
  visible,
  onClose,
  selectedRatings,
  onChangeRatings,
  selectedPrices,
  onChangePrices,
  selectedLevels,
  onChangeLevels,
}) => {
  const ratings = [5, 4, 3, 2, 1];
  const priceRanges = [
    { label: 'Free', min: 0, max: 0 },
    { label: '$1 - $50', min: 1, max: 50 },
    { label: '$51 - $100', min: 51, max: 100 },
    { label: '$101 - $200', min: 101, max: 200 },
    { label: '$200+', min: 201, max: 10000 },
  ];
  const levels = ['Beginner', 'Intermediate', 'Advanced'];

  const toggleRating = (rating: number) => {
    if (selectedRatings.includes(rating)) {
      onChangeRatings(selectedRatings.filter(r => r !== rating));
    } else {
      onChangeRatings([...selectedRatings, rating]);
    }
  };

  const togglePrice = (min: number, max: number) => {
    const exists = selectedPrices.some(p => p[0] === min && p[1] === max);
    if (exists) {
      onChangePrices(selectedPrices.filter(p => !(p[0] === min && p[1] === max)));
    } else {
      onChangePrices([...selectedPrices, [min, max]]);
    }
  };

  const toggleLevel = (level: string) => {
    if (selectedLevels.includes(level)) {
      onChangeLevels(selectedLevels.filter(l => l !== level));
    } else {
      onChangeLevels([...selectedLevels, level]);
    }
  };

  const clearAll = () => {
    onChangeRatings([]);
    onChangePrices([]);
    onChangeLevels([]);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/30">
        <TouchableOpacity 
          className="flex-1" 
          activeOpacity={1} 
          onPress={onClose}
        />
        <View className="bg-white rounded-t-3xl h-4/5">
          {/* Header */}
          <View className="flex-row justify-between items-center px-5 py-4 border-b border-gray-200">
            <Text className="text-xl font-bold text-gray-900">Filters</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-5">
            {/* Clear All */}
            <TouchableOpacity 
              onPress={clearAll}
              className="self-end py-3"
            >
              <Text className="text-purple-600 font-semibold">Clear All</Text>
            </TouchableOpacity>

            {/* Rating Filter */}
            <View className="mb-6">
              <Text className="text-base font-bold text-gray-900 mb-3">Rating</Text>
              {ratings.map(rating => (
                <TouchableOpacity
                  key={rating}
                  onPress={() => toggleRating(rating)}
                  className="flex-row items-center py-2"
                >
                  <View className={`w-5 h-5 rounded border-2 mr-3 items-center justify-center ${
                    selectedRatings.includes(rating) ? 'bg-purple-600 border-purple-600' : 'border-gray-300'
                  }`}>
                    {selectedRatings.includes(rating) && (
                      <Text className="text-white text-xs">✓</Text>
                    )}
                  </View>
                  <View className="flex-row items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        color={i < rating ? "#FFA500" : "#E5E7EB"}
                        fill={i < rating ? "#FFA500" : "transparent"}
                      />
                    ))}
                    <Text className="ml-2 text-gray-700">{rating}.0 & up</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Price Filter */}
            <View className="mb-6">
              <Text className="text-base font-bold text-gray-900 mb-3">Price Range</Text>
              {priceRanges.map(range => {
                const isSelected = selectedPrices.some(
                  p => p[0] === range.min && p[1] === range.max
                );
                return (
                  <TouchableOpacity
                    key={range.label}
                    onPress={() => togglePrice(range.min, range.max)}
                    className="flex-row items-center py-2"
                  >
                    <View className={`w-5 h-5 rounded border-2 mr-3 items-center justify-center ${
                      isSelected ? 'bg-purple-600 border-purple-600' : 'border-gray-300'
                    }`}>
                      {isSelected && (
                        <Text className="text-white text-xs">✓</Text>
                      )}
                    </View>
                    <Text className="text-gray-700">{range.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Level Filter */}
            <View className="mb-6">
              <Text className="text-base font-bold text-gray-900 mb-3">Level</Text>
              {levels.map(level => (
                <TouchableOpacity
                  key={level}
                  onPress={() => toggleLevel(level)}
                  className="flex-row items-center py-2"
                >
                  <View className={`w-5 h-5 rounded border-2 mr-3 items-center justify-center ${
                    selectedLevels.includes(level) ? 'bg-purple-600 border-purple-600' : 'border-gray-300'
                  }`}>
                    {selectedLevels.includes(level) && (
                      <Text className="text-white text-xs">✓</Text>
                    )}
                  </View>
                  <Text className="text-gray-700">{level}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Apply Button */}
          <View className="px-5 py-4 border-t border-gray-200">
            <TouchableOpacity
              onPress={onClose}
              className="bg-purple-600 rounded-xl py-4 items-center"
            >
              <Text className="text-white font-bold text-base">Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Main Component
const CourseExploreScreen: React.FC = () => {
  const navigation = useNavigation<CourseExploreNavigationProp>();
  const { getAllUserCourses, loading } = useCourseService();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<number[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [page, setPage] = useState(1);
  const [totalCourses, setTotalCourses] = useState(0);
  const [filterVisible, setFilterVisible] = useState(false);
  
  // Filter states
  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const [selectedPrices, setSelectedPrices] = useState<number[][]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);

  const scrollViewRef = useRef<ScrollView>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track previous filter/search state
  const prevFilters = useRef<{
    search: string;
    ratings: number[];
    prices: number[][];
    levels: string[];
  }>({
    search: '',
    ratings: [],
    prices: [],
    levels: [],
  });

  // Debounce search
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    const filtersChanged =
      prevFilters.current.search !== debouncedSearchQuery ||
      JSON.stringify(prevFilters.current.ratings) !== JSON.stringify(selectedRatings) ||
      JSON.stringify(prevFilters.current.prices) !== JSON.stringify(selectedPrices) ||
      JSON.stringify(prevFilters.current.levels) !== JSON.stringify(selectedLevels);

    if (filtersChanged) {
      setPage(1);
      setCourses([]);
    }

    prevFilters.current = {
      search: debouncedSearchQuery,
      ratings: selectedRatings,
      prices: selectedPrices,
      levels: selectedLevels,
    };
  }, [debouncedSearchQuery, selectedRatings, selectedPrices, selectedLevels]);

  // Fetch courses
  useEffect(() => {
    let isMounted = true;

    const fetchCourses = async () => {
      try {
        let allResults: Course[] = [];
        let total = 0;

        const ratings = selectedRatings.length ? selectedRatings : undefined;
        const expertiseLevels = selectedLevels.length ? selectedLevels : undefined;

        if (selectedPrices.length > 0) {
          const promises = selectedPrices.map(async ([min, max]) => {
            return await getAllUserCourses(
              page,
              20,
              'createdAt',
              'DESC',
              debouncedSearchQuery,
              ratings,
              [min, max],
              expertiseLevels
            );
          });
          const responses = await Promise.all(promises);
          const results = responses.flatMap((res) => res.data);
          
          // Deduplicate by id
          allResults = results.filter(
            (c, idx, arr) => arr.findIndex((cc) => cc.id === c.id) === idx
          );
          total = allResults.length;
        } else {
          const response = await getAllUserCourses(
            page,
            20,
            'createdAt',
            'DESC',
            debouncedSearchQuery,
            ratings,
            undefined,
            expertiseLevels
          );
          allResults = response.data;
          total = response.total;
        }

        if (!isMounted) return;

        if (page === 1) {
          setCourses(allResults);
        } else {
          setCourses((prev) => [...prev, ...allResults]);
        }
        setTotalCourses(total);
      } catch (error) {
        if (isMounted) {
          console.error('Error fetching courses:', error);
        }
      }
    };

    fetchCourses();

    return () => {
      isMounted = false;
    };
  }, [page, debouncedSearchQuery, selectedRatings, selectedPrices, selectedLevels]);

  const toggleFavorite = (courseId: number) => {
    setFavorites(prev =>
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleCoursePress = (courseId: number) => {
    navigation.navigate('DetailCourseScreen', { courseId });
  };

  const handleLoadMore = () => {
    if (!loading && courses.length < totalCourses) {
      setPage(prev => prev + 1);
    }
  };

  const isCloseToBottom = ({
    layoutMeasurement,
    contentOffset,
    contentSize,
  }: any) => {
    const paddingToBottom = 20;
    return layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom;
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-5 pt-4 pb-5 border-b border-gray-100">
        <View className="h-14 justify-center mb-4 relative">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
            className="absolute left-0 p-3 z-10"
          >
            <Image
              source={require('../assets/Badges Arrow.png')}
              className="w-10 h-10"
              resizeMode="contain"
            />
          </TouchableOpacity>

          <Text className="text-gray-900 font-bold text-lg text-center">
            Explore course
          </Text>
        </View>

        {/* Search and Filter */}
        <View className="flex-row items-center gap-2">
          {/* Search Bar */}
          <View className="flex-1 flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
            <Image
              source={require('../assets/search.png')}
              className="w-6 h-6 mr-2"
              resizeMode="contain"
            />
            <TextInput
              placeholder="Search your course..."
              placeholderTextColor="#9CA3AF"
              className="flex-1 text-gray-800 text-base"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Filter Button */}
          <TouchableOpacity
            onPress={() => setFilterVisible(true)}
            className="bg-gray-100 rounded-xl p-3"
          >
            <Image
              source={require('../assets/Filter.png')}
              className="w-6 h-6"
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        {/* Active Filters Count */}
        {(selectedRatings.length > 0 || selectedPrices.length > 0 || selectedLevels.length > 0) && (
          <View className="mt-3 flex-row items-center">
            <Text className="text-gray-600 text-sm">
              Active filters: {selectedRatings.length + selectedPrices.length + selectedLevels.length}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setSelectedRatings([]);
                setSelectedPrices([]);
                setSelectedLevels([]);
              }}
              className="ml-2"
            >
              <Text className="text-purple-600 text-sm font-semibold">Clear all</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Course List */}
      <ScrollView
        ref={scrollViewRef}
        className="flex-1 bg-white"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        onScroll={({ nativeEvent }) => {
          if (isCloseToBottom(nativeEvent)) {
            handleLoadMore();
          }
        }}
        scrollEventThrottle={400}
      >
        <Text className="text-gray-900 font-bold text-base mb-4">
          Related Result {totalCourses > 0 && `(${totalCourses})`}
        </Text>

        {courses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            isFavorited={favorites.includes(course.id)}
            onToggleFavorite={() => toggleFavorite(course.id)}
            onPress={() => handleCoursePress(course.id)}
          />
        ))}

        {/* Loading Indicator */}
        {loading && (
          <View className="py-8 items-center">
            <ActivityIndicator size="large" color="#9333EA" />
            <Text className="text-gray-500 mt-2">Loading courses...</Text>
          </View>
        )}

        {/* No Results */}
        {!loading && courses.length === 0 && (
          <View className="py-16 items-center">
            <Text className="text-gray-500 text-base">No courses found</Text>
            <Text className="text-gray-400 text-sm mt-1">Try adjusting your filters</Text>
          </View>
        )}

        {/* End of Results */}
        {!loading && courses.length > 0 && courses.length >= totalCourses && (
          <View className="py-8 items-center">
            <Text className="text-gray-500 text-sm">You've reached the end</Text>
          </View>
        )}
      </ScrollView>

      {/* Filter Sidebar */}
      <FilterSidebar
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        selectedRatings={selectedRatings}
        onChangeRatings={setSelectedRatings}
        selectedPrices={selectedPrices}
        onChangePrices={setSelectedPrices}
        selectedLevels={selectedLevels}
        onChangeLevels={setSelectedLevels}
      />
    </SafeAreaView>
  );
};

export default CourseExploreScreen;