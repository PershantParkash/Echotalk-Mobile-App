import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StatusBar } from 'react-native';
import { ChevronLeft, UserPlus, Home, MessageCircle, Phone, User } from 'lucide-react-native';

interface Contact {
  id: string;
  name: string;
  online: boolean;
  image: string;
}

interface Message {
  id: string;
  name: string;
  message: string;
  time: string;
  unread?: number;
  image: string;
}

const MessagesScreen = () => {
  const contacts: Contact[] = [
    { id: '1', name: 'Christopher', online: true, image: 'https://i.pravatar.cc/150?img=12' },
    { id: '2', name: 'Reese', online: true, image: 'https://i.pravatar.cc/150?img=13' },
    { id: '3', name: 'Jeffrey', online: true, image: 'https://i.pravatar.cc/150?img=14' },
    { id: '4', name: 'Laura', online: true, image: 'https://i.pravatar.cc/150?img=44' },
    { id: '5', name: 'Mo', online: true, image: 'https://i.pravatar.cc/150?img=15' },
  ];

  const messages: Message[] = [
    {
      id: '1',
      name: 'Ellen Lambert',
      message: "Hey! How's it going?",
      time: '04:04AM',
      unread: 3,
      image: 'https://i.pravatar.cc/150?img=45'
    },
    {
      id: '2',
      name: 'Connor Frazier',
      message: 'What kind of music do you like?',
      time: '08:58PM',
      unread: 1,
      image: 'https://i.pravatar.cc/150?img=33'
    },
    {
      id: '3',
      name: 'Josephine Gordon',
      message: 'Sounds good to me!',
      time: '11:33PM',
      image: 'https://i.pravatar.cc/150?img=47'
    },
    {
      id: '4',
      name: 'Timothy Steele',
      message: "Hi Tina. How's your night going?",
      time: '06:58PM',
      image: 'https://i.pravatar.cc/150?img=17'
    },
    {
      id: '5',
      name: 'Lou Quinn',
      message: 'What did you do over the weekend?',
      time: '09:43PM',
      image: 'https://i.pravatar.cc/150?img=18'
    },
  ];

  return (
    <View className="flex-1 bg-white">
     

      {/* Header */}
      <View className="flex-row justify-between items-center px-6 py-4">
        <TouchableOpacity className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center">
          <ChevronLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-3xl font-bold">Messages</Text>
        <TouchableOpacity className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center">
          <UserPlus size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Contacts Section */}
        <View className="px-6 py-4">
          <Text className="text-2xl font-bold mb-4">Contacts</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-2">
            {contacts.map((contact) => (
              <TouchableOpacity key={contact.id} className="items-center mx-2">
                <View className="relative">
                  <Image
                    source={{ uri: contact.image }}
                    className="w-16 h-16 rounded-full"
                  />
                  {contact.online && (
                    <View className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </View>
                <Text className="text-sm mt-2 font-medium">{contact.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Messages List */}
        <View className="px-6 py-2">
          {messages.map((msg) => (
            <TouchableOpacity
              key={msg.id}
              className="flex-row items-center py-4 border-b border-gray-100"
            >
              <View className="relative mr-4">
                <Image
                  source={{ uri: msg.image }}
                  className="w-16 h-16 rounded-full"
                />
                {msg.unread && (
                  <View className="absolute -bottom-1 -right-1 w-7 h-7 bg-red-500 rounded-full items-center justify-center border-2 border-white">
                    <Text className="text-white text-xs font-bold">{msg.unread}</Text>
                  </View>
                )}
              </View>
              <View className="flex-1">
                <View className="flex-row justify-between items-start mb-1">
                  <Text className="text-lg font-bold">{msg.name}</Text>
                  <Text className="text-sm text-gray-500">{msg.time}</Text>
                </View>
                <Text className="text-gray-500 text-base">{msg.message}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

    
    </View>
  );
};

export default MessagesScreen;
