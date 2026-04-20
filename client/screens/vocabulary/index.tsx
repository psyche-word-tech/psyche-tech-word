import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';

interface WordBook {
  id: number;
  name: string;
  price: number;
  selected: boolean;
}

export default function VocabularyPage() {
  const router = useSafeRouter();
  const [activeTab, setActiveTab] = useState<'exchange' | 'buy'>('exchange');
  const [wordBooks, setWordBooks] = useState<WordBook[]>([
    { id: 1, name: '高中词汇', price: 10, selected: false },
    { id: 2, name: '四级词汇', price: 12, selected: false },
    { id: 3, name: '六级词汇', price: 15, selected: false },
    { id: 4, name: '考研词汇', price: 20, selected: false },
  ]);

  const toggleSelect = (id: number) => {
    setWordBooks(books =>
      books.map(book =>
        book.id === id ? { ...book, selected: !book.selected } : book
      )
    );
  };

  const selectedBook = wordBooks.find(book => book.selected);

  const handleBuy = () => {
    if (selectedBook) {
      router.push('/purchase');
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>← back</Text>
          </TouchableOpacity>
          
          <View style={styles.tabs}>
            <TouchableOpacity onPress={() => setActiveTab('exchange')}>
              <Text style={[styles.tabText, activeTab === 'exchange' && styles.tabActive]}>
                兑换
              </Text>
              {activeTab === 'exchange' && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('buy')}>
              <Text style={[styles.tabText, activeTab === 'buy' && styles.tabActive]}>
                购买
              </Text>
              {activeTab === 'buy' && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
          </View>
          
          <View style={styles.placeholder} />
        </View>

        {/* Word Books Grid */}
        <View style={styles.gridContainer}>
          {wordBooks.map(book => (
            <TouchableOpacity
              key={book.id}
              style={styles.card}
              onPress={() => toggleSelect(book.id)}
            >
              {/* Checkbox */}
              <View style={[styles.checkbox, book.selected && styles.checkboxSelected]}>
                {book.selected && <Text style={styles.checkmark}>✓</Text>}
              </View>
              
              {/* Book Name - Vertical */}
              <View style={styles.nameContainer}>
                {book.name.split('').map((char, i) => (
                  <Text key={i} style={styles.nameText}>{char}</Text>
                ))}
              </View>
              
              {/* Price - Vertical */}
              <View style={styles.priceContainer}>
                <Text style={styles.priceText}>{book.price}</Text>
                <Text style={styles.currencyText}>蝴蝶币</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Buy Button */}
        {selectedBook && (
          <View style={styles.buyButtonContainer}>
            <TouchableOpacity style={styles.buyButton} onPress={handleBuy}>
              <Text style={styles.buyButtonText}>购买</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#E5E5E5',
  },
  backText: {
    fontSize: 14,
    color: '#000000',
    fontFamily: 'serif',
  },
  tabs: {
    flexDirection: 'row',
    gap: 30,
  },
  tabText: {
    fontSize: 14,
    color: '#999999',
    fontFamily: 'serif',
  },
  tabActive: {
    color: '#333333',
  },
  tabUnderline: {
    height: 2,
    backgroundColor: '#333333',
    marginTop: 4,
  },
  placeholder: {
    width: 50,
  },
  gridContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  card: {
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    minWidth: 55,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#333333',
    borderColor: '#333333',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  nameContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  nameText: {
    fontSize: 14,
    color: '#333333',
    fontFamily: 'serif',
  },
  priceContainer: {
    alignItems: 'center',
  },
  priceText: {
    fontSize: 16,
    color: '#333333',
    fontFamily: 'serif',
    fontWeight: '600',
  },
  currencyText: {
    fontSize: 10,
    color: '#666666',
    fontFamily: 'serif',
  },
  buyButtonContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  buyButton: {
    backgroundColor: '#333333',
    paddingVertical: 12,
    alignItems: 'center',
  },
  buyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'serif',
  },
});
