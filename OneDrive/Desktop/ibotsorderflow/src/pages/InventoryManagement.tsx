import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Package, 
  Plus, 
  Edit2, 
  Trash2, 
  Download, 
  AlertCircle,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Tag,
  DollarSign,
  Truck,
  Save,
  X,
  ShoppingCart,
  Box,
  ShoppingBag,
  Percent,
  MapPin,
  Users,
  Globe,
  Shield,
  FileSpreadsheet,
  FileText,
  Printer,
  Upload,
  Layers,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  Calendar
} from 'lucide-react';
import { db } from "../firebase";
import { useAuth } from "../App";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch,
  increment,
  getDocs
} from 'firebase/firestore';
import * as XLSX from 'xlsx';

// ============ TYPES AND INTERFACES ============
interface StockEntry {
  id?: string;
  date: Timestamp | Date;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  addedBy: string;
  addedByName: string;
}

interface Product {
  id: string;
  name: string;
  totalQuantity: number;
  totalValue: number;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  createdBy: string;
  createdByName: string;
  category: string;
  sku?: string;
  description?: string;
  lowStockThreshold: number;
  stockEntries: StockEntry[];
  currentPrice?: number;
}

interface Transaction {
  id: string;
  productId: string;
  productName: string;
  type: 'add' | 'deliver' | 'adjust' | 'delete';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  price: number;
  totalAmount: number;
  performedBy: string;
  performedByName: string;
  notes?: string;
  createdAt: Timestamp;
}

type SortField = 'name' | 'totalQuantity' | 'currentPrice' | 'totalValue' | 'category' | 'updatedAt';
type SortDirection = 'asc' | 'desc';
type StockFilter = 'all' | 'low' | 'out' | 'normal';

// ============ HELPER FUNCTIONS ============
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (date: Timestamp | Date | string): string => {
  let d: Date;
  
  if (date instanceof Timestamp) {
    d = date.toDate();
  } else if (date instanceof Date) {
    d = date;
  } else {
    d = new Date(date);
  }
  
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatDateTime = (date: Timestamp | Date | string): string => {
  let d: Date;
  
  if (date instanceof Timestamp) {
    d = date.toDate();
  } else if (date instanceof Date) {
    d = date;
  } else {
    d = new Date(date);
  }
  
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const generateSKU = (name: string, category: string): string => {
  const prefix = category.substring(0, 3).toUpperCase();
  const nameCode = name.substring(0, 3).toUpperCase();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${nameCode}-${random}`;
};

const getStockStatus = (quantity: number, threshold: number): string => {
  if (quantity === 0) return 'out-of-stock';
  if (quantity <= threshold) return 'low-stock';
  return 'in-stock';
};

const getStockColor = (quantity: number, threshold: number): string => {
  if (quantity === 0) return 'bg-red-100 text-red-800 border-red-200';
  if (quantity <= threshold) return 'bg-orange-100 text-orange-800 border-orange-200';
  return 'bg-green-100 text-green-800 border-green-200';
};

// ============ MAIN COMPONENT ============
const InventoryManagement: React.FC = () => {
  const { user } = useAuth();
  
  // ============ STATES ============
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStock, setFilterStock] = useState<StockFilter>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [categories, setCategories] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [isDeletingTransactions, setIsDeletingTransactions] = useState(false);

  // Form states
  const [newProduct, setNewProduct] = useState({
    name: '',
    quantity: 0,
    price: 0,
    category: '',
    description: '',
    lowStockThreshold: 10,
  });

  const [editForm, setEditForm] = useState<Partial<Product>>({});
  const [transactionForm, setTransactionForm] = useState({
    type: 'add' as 'add' | 'deliver' | 'adjust',
    quantity: 0,
    price: 0,
    notes: '',
  });

  // ============ FIREBASE SUBSCRIPTIONS ============
  useEffect(() => {
    if (!user) return;

    setLoading(true);

    // Subscribe to products collection
    const productsQuery = query(
      collection(db, 'products'),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribeProducts = onSnapshot(productsQuery, 
      (snapshot) => {
        const productsData: Product[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            // Ensure stockEntries exists and is an array
            stockEntries: data.stockEntries || [],
            // Calculate current price from the latest stock entry or fallback
            currentPrice: data.stockEntries && data.stockEntries.length > 0 
              ? data.stockEntries[data.stockEntries.length - 1].unitPrice 
              : data.price || 0,
          } as Product;
        });
        
        setProducts(productsData);
        
        // Extract unique categories
        const uniqueCategories = Array.from(
          new Set(productsData.map(p => p.category).filter(Boolean))
        );
        setCategories(uniqueCategories);
        
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching products:', error);
        setLoading(false);
      }
    );

    // Subscribe to transactions collection (last 50)
    const transactionsQuery = query(
      collection(db, 'transactions'),
      orderBy('createdAt', 'desc'),
      where('performedBy', '==', user.uid)
    );

    const unsubscribeTransactions = onSnapshot(transactionsQuery,
      (snapshot) => {
        const transactionsData: Transaction[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Transaction));
        setTransactions(transactionsData);
      }
    );

    return () => {
      unsubscribeProducts();
      unsubscribeTransactions();
    };
  }, [user]);

  // ============ HANDLERS ============
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newProduct.name || !newProduct.category || newProduct.price <= 0) {
      alert('Please fill all required fields (Name, Category, Price)');
      return;
    }

    try {
      // Check if product already exists (case-insensitive)
      const existingProduct = products.find(
        p => p.name.toLowerCase() === newProduct.name.toLowerCase() && 
             p.category.toLowerCase() === newProduct.category.toLowerCase()
      );

      if (existingProduct) {
        // Add to existing product's stock entries
        const productRef = doc(db, 'products', existingProduct.id);
        const newQuantity = existingProduct.totalQuantity + (newProduct.quantity || 0);
        const newStockEntry: StockEntry = {
          date: serverTimestamp(),
          quantity: newProduct.quantity || 0,
          unitPrice: newProduct.price,
          totalPrice: (newProduct.quantity || 0) * newProduct.price,
          addedBy: user.uid,
          addedByName: user.name || user.email,
        };

        const updatedStockEntries = [...(existingProduct.stockEntries || []), newStockEntry];
        const newTotalValue = updatedStockEntries.reduce((sum, entry) => sum + entry.totalPrice, 0);

        await updateDoc(productRef, {
          totalQuantity: newQuantity,
          totalValue: newTotalValue,
          stockEntries: updatedStockEntries,
          currentPrice: newProduct.price, // Update to latest price
          updatedAt: serverTimestamp(),
        });

        // Add transaction record
        await addDoc(collection(db, 'transactions'), {
          productId: existingProduct.id,
          productName: existingProduct.name,
          type: 'add',
          quantity: newProduct.quantity || 0,
          previousQuantity: existingProduct.totalQuantity,
          newQuantity: newQuantity,
          price: newProduct.price,
          totalAmount: (newProduct.quantity || 0) * newProduct.price,
          performedBy: user.uid,
          performedByName: user.name || user.email,
          notes: newProduct.description || `Added ${newProduct.quantity || 0} units`,
          createdAt: serverTimestamp(),
        });

        alert(`Added stock to existing product: ${existingProduct.name}`);
      } else {
        // Create new product with initial stock entry
        const initialStockEntry: StockEntry = {
          date: Timestamp.now(),
          quantity: newProduct.quantity || 0,
          unitPrice: newProduct.price,
          totalPrice: (newProduct.quantity || 0) * newProduct.price,
          addedBy: user.uid,
          addedByName: user.name || user.email,
        };

        const productData = {
          name: newProduct.name,
          totalQuantity: newProduct.quantity || 0,
          totalValue: (newProduct.quantity || 0) * newProduct.price,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: user.uid,
          createdByName: user.name || user.email,
          category: newProduct.category,
          description: newProduct.description || '',
          lowStockThreshold: newProduct.lowStockThreshold,
          sku: generateSKU(newProduct.name, newProduct.category),
          stockEntries: [initialStockEntry],
          currentPrice: newProduct.price,
        };

        const docRef = await addDoc(collection(db, 'products'), productData);

        // Add transaction record if quantity > 0
        if (newProduct.quantity > 0) {
          await addDoc(collection(db, 'transactions'), {
            productId: docRef.id,
            productName: newProduct.name,
            type: 'add',
            quantity: newProduct.quantity,
            previousQuantity: 0,
            newQuantity: newProduct.quantity,
            price: newProduct.price,
            totalAmount: newProduct.quantity * newProduct.price,
            performedBy: user.uid,
            performedByName: user.name || user.email,
            notes: newProduct.description || 'Initial stock',
            createdAt: serverTimestamp(),
          });
        }
      }

      // Reset form
      setNewProduct({
        name: '',
        quantity: 0,
        price: 0,
        category: '',
        description: '',
        lowStockThreshold: 10,
      });
      setIsAddModalOpen(false);
      
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Failed to add product');
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      const productRef = doc(db, 'products', selectedProduct.id);
      
      const updateData: any = {
        name: editForm.name || selectedProduct.name,
        category: editForm.category || selectedProduct.category,
        description: editForm.description !== undefined ? editForm.description : selectedProduct.description,
        lowStockThreshold: editForm.lowStockThreshold || selectedProduct.lowStockThreshold,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(productRef, updateData);
      setIsEditModalOpen(false);
      setSelectedProduct(null);
      setEditForm({});
      
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Failed to update product');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const productRef = doc(db, 'products', productId);
      const product = products.find(p => p.id === productId);
      
      if (product) {
        // Add delete transaction
        await addDoc(collection(db, 'transactions'), {
          productId: productId,
          productName: product.name,
          type: 'delete',
          quantity: product.totalQuantity,
          previousQuantity: product.totalQuantity,
          newQuantity: 0,
          price: product.currentPrice || 0,
          totalAmount: product.totalValue,
          performedBy: user.uid,
          performedByName: user.name || user.email,
          notes: 'Product deleted from inventory',
          createdAt: serverTimestamp(),
        });
      }
      
      await deleteDoc(productRef);
      setIsDeleteConfirmOpen(false);
      setProductToDelete(null);
      
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      const productRef = doc(db, 'products', selectedProduct.id);
      let newQuantity = selectedProduct.totalQuantity;
      let newStockEntry: StockEntry | null = null;
      
      if (transactionForm.type === 'add') {
        newQuantity = selectedProduct.totalQuantity + transactionForm.quantity;
        newStockEntry = {
          date: Timestamp.now(),
          quantity: transactionForm.quantity,
          unitPrice: transactionForm.price || selectedProduct.currentPrice || 0,
          totalPrice: transactionForm.quantity * (transactionForm.price || selectedProduct.currentPrice || 0),
          addedBy: user.uid,
          addedByName: user.name || user.email,
        };
      } else if (transactionForm.type === 'deliver') {
        if (selectedProduct.totalQuantity < transactionForm.quantity) {
          alert('Cannot deliver more than available quantity');
          return;
        }
        newQuantity = selectedProduct.totalQuantity - transactionForm.quantity;
        // For deliveries, we don't add a stock entry, just reduce quantity
      }

      const updatedStockEntries = newStockEntry 
        ? [...(selectedProduct.stockEntries || []), newStockEntry]
        : selectedProduct.stockEntries;

      const newTotalValue = updatedStockEntries.reduce((sum, entry) => sum + entry.totalPrice, 0);
      
      // Update product
      await updateDoc(productRef, {
        totalQuantity: newQuantity,
        totalValue: newTotalValue,
        stockEntries: updatedStockEntries,
        currentPrice: transactionForm.price || selectedProduct.currentPrice || 0,
        updatedAt: serverTimestamp(),
      });

      // Add transaction record
      await addDoc(collection(db, 'transactions'), {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        type: transactionForm.type,
        quantity: transactionForm.quantity,
        previousQuantity: selectedProduct.totalQuantity,
        newQuantity: newQuantity,
        price: transactionForm.price || selectedProduct.currentPrice || 0,
        totalAmount: transactionForm.quantity * (transactionForm.price || selectedProduct.currentPrice || 0),
        performedBy: user.uid,
        performedByName: user.name || user.email,
        notes: transactionForm.notes || "",
        createdAt: serverTimestamp(),
      });

      // Reset form
      setTransactionForm({
        type: 'add',
        quantity: 0,
        price: 0,
        notes: '',
      });
      setIsTransactionModalOpen(false);
      setSelectedProduct(null);
      
    } catch (error) {
      console.error('Error processing transaction:', error);
      alert('Failed to process transaction');
    }
  };

  const handleExportCSV = () => {
    setIsExporting(true);
    try {
      const exportProducts = filteredProducts.map(product => {
        // Create main product row
        const mainRow = {
          'Product Name': product.name,
          'SKU': product.sku || '',
          'Category': product.category,
          'Total Quantity': product.totalQuantity,
          'Current Price': product.currentPrice || 0,
          'Total Value': product.totalValue,
          'Low Stock Threshold': product.lowStockThreshold,
          'Description': product.description || '',
          'Created By': product.createdByName,
          'Last Updated': formatDate(product.updatedAt),
        };

        // Create rows for each stock entry
        const stockEntryRows = (product.stockEntries || []).map((entry, index) => ({
          'Product Name': `${product.name} - Stock Entry ${index + 1}`,
          'SKU': product.sku || '',
          'Category': product.category,
          'Entry Date': entry.date instanceof Timestamp ? formatDateTime(entry.date) : formatDateTime(new Date(entry.date)),
          'Quantity Added': entry.quantity,
          'Unit Price': entry.unitPrice,
          'Total Price': entry.totalPrice,
          'Added By': entry.addedByName,
          'Low Stock Threshold': product.lowStockThreshold,
          'Description': product.description || '',
          'Created By': product.createdByName,
          'Last Updated': formatDate(product.updatedAt),
        }));

        return [mainRow, ...stockEntryRows];
      }).flat();

      const worksheet = XLSX.utils.json_to_sheet(exportProducts);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');
      XLSX.writeFile(workbook, `inventory-${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  // ============ DELETE ALL TRANSACTIONS HANDLER ============
  const handleDeleteAllTransactions = async () => {
    if (!window.confirm('Are you sure you want to delete ALL transactions? This action cannot be undone and will permanently remove all transaction history.')) {
      return;
    }

    setIsDeletingTransactions(true);
    try {
      const transactionsRef = collection(db, 'transactions');
      const querySnapshot = await getDocs(transactionsRef);
      
      if (querySnapshot.empty) {
        alert('No transactions found to delete.');
        setIsDeletingTransactions(false);
        return;
      }

      // Use batched writes for better performance
      const batch = writeBatch(db);
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      alert(`Successfully deleted ${querySnapshot.size} transactions.`);
      
    } catch (error) {
      console.error('Error deleting transactions:', error);
      alert('Failed to delete transactions. Please try again.');
    } finally {
      setIsDeletingTransactions(false);
    }
  };

  // ============ PERMISSION CHECKS ============
  const canEditProduct = (product: Product): boolean => {
    if (user?.role === 'admin') return true;
    if (user?.role === 'manager') return true;
    if (product.createdBy === user?.uid) return true;
    return false;
  };

  const canDeleteProduct = (product: Product): boolean => {
    return user?.role === 'admin';
  };

  const canAddProduct = (): boolean => {
    return user?.role === 'admin' || user?.role === 'manager' || user?.role === 'staff';
  };

  const canViewTransactions = (): boolean => {
    return user?.role === 'admin' || user?.role === 'manager';
  };

  const canDeleteTransactions = (): boolean => {
    return user?.role === 'admin';
  };

  // ============ FILTERED AND SORTED DATA ============
  const filteredProducts = useMemo(() => {
    let filtered = products;
    
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (filterCategory !== 'all') {
      filtered = filtered.filter(product => product.category === filterCategory);
    }
    
    if (filterStock !== 'all') {
      filtered = filtered.filter(product => {
        if (filterStock === 'low') return product.totalQuantity <= product.lowStockThreshold && product.totalQuantity > 0;
        if (filterStock === 'out') return product.totalQuantity === 0;
        if (filterStock === 'normal') return product.totalQuantity > product.lowStockThreshold;
        return true;
      });
    }
    
    filtered = [...filtered].sort((a, b) => {
      let aValue: any, bValue: any;
      
      if (sortField === 'updatedAt' || sortField === 'createdAt') {
        aValue = a[sortField] instanceof Timestamp 
          ? (a[sortField] as Timestamp).toDate() 
          : new Date(a[sortField] as string);
        bValue = b[sortField] instanceof Timestamp 
          ? (b[sortField] as Timestamp).toDate() 
          : new Date(b[sortField] as string);
      } else {
        aValue = a[sortField];
        bValue = b[sortField];
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filtered;
  }, [products, searchTerm, filterCategory, filterStock, sortField, sortDirection]);

  // ============ STATISTICS ============
  const stats = useMemo(() => {
    const totalProducts = products.length;
    const totalValue = products.reduce((sum, p) => sum + p.totalValue, 0);
    const lowStock = products.filter(p => 
      p.totalQuantity <= p.lowStockThreshold && p.totalQuantity > 0
    ).length;
    const outOfStock = products.filter(p => p.totalQuantity === 0).length;
    
    return {
      totalProducts,
      totalValue,
      lowStock,
      outOfStock,
    };
  }, [products]);

  // ============ RENDER FUNCTIONS ============
  const renderStockBadge = (product: Product) => {
    const status = getStockStatus(product.totalQuantity, product.lowStockThreshold);
    const color = getStockColor(product.totalQuantity, product.lowStockThreshold);
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${color}`}>
        {status === 'out-of-stock' ? <XCircle className="w-3 h-3 mr-1" /> :
         status === 'low-stock' ? <AlertCircle className="w-3 h-3 mr-1" /> :
         <CheckCircle className="w-3 h-3 mr-1" />}
        <span>
          {status === 'out-of-stock' ? 'Out of Stock' : 
           status === 'low-stock' ? 'Low Stock' : 
           'In Stock'}
        </span>
      </span>
    );
  };

  // ============ MODALS ============
  const renderAddProductModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Add New Product</h2>
          <button
            onClick={() => setIsAddModalOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleAddProduct} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                value={newProduct.name}
                onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter product name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <input
                type="text"
                value={newProduct.category}
                onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Electronics, Clothing, Food"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (per unit) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newProduct.price}
                onChange={(e) => setNewProduct({...newProduct, price: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Initial Quantity
              </label>
              <input
                type="number"
                min="0"
                value={newProduct.quantity}
                onChange={(e) => setNewProduct({...newProduct, quantity: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Low Stock Threshold
              </label>
              <input
                type="number"
                min="0"
                value={newProduct.lowStockThreshold}
                onChange={(e) => setNewProduct({...newProduct, lowStockThreshold: parseInt(e.target.value) || 10})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={newProduct.description}
              onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Product description..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderEditProductModal = () => {
    if (!selectedProduct) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl w-full max-w-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Edit Product</h2>
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleUpdateProduct} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={editForm.name || selectedProduct.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <input
                  type="text"
                  value={editForm.category || selectedProduct.category}
                  onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Price (per unit) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={selectedProduct.currentPrice || 0}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">Price can only be changed when adding new stock</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Low Stock Threshold
                </label>
                <input
                  type="number"
                  min="0"
                  value={editForm.lowStockThreshold || selectedProduct.lowStockThreshold}
                  onChange={(e) => setEditForm({...editForm, lowStockThreshold: parseInt(e.target.value) || 10})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={editForm.description !== undefined ? editForm.description : selectedProduct.description || ''}
                onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Update Product
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderTransactionModal = () => {
    if (!selectedProduct) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl w-full max-w-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {transactionForm.type === 'add' ? 'Add Stock' : 'Deliver Stock'}
            </h2>
            <button
              onClick={() => setIsTransactionModalOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900">{selectedProduct.name}</h3>
            <p className="text-sm text-gray-600">Current Stock: {selectedProduct.totalQuantity}</p>
            <p className="text-sm text-gray-600">Current Price: {formatCurrency(selectedProduct.currentPrice || 0)}</p>
          </div>
          
          <form onSubmit={handleTransaction} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction Type
              </label>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setTransactionForm({...transactionForm, type: 'add'})}
                  className={`flex-1 py-2 rounded-lg border ${
                    transactionForm.type === 'add' 
                      ? 'bg-green-100 text-green-700 border-green-300' 
                      : 'bg-gray-100 text-gray-700 border-gray-300'
                  }`}
                >
                  <Plus className="w-4 h-4 inline mr-2" />
                  Add Stock
                </button>
                <button
                  type="button"
                  onClick={() => setTransactionForm({...transactionForm, type: 'deliver'})}
                  className={`flex-1 py-2 rounded-lg border ${
                    transactionForm.type === 'deliver' 
                      ? 'bg-red-100 text-red-700 border-red-300' 
                      : 'bg-gray-100 text-gray-700 border-gray-300'
                  }`}
                >
                  <Truck className="w-4 h-4 inline mr-2" />
                  Deliver Stock
                </button>
              </div>
            </div>

            {transactionForm.type === 'add' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (per unit) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={transactionForm.price}
                  onChange={(e) => setTransactionForm({...transactionForm, price: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={selectedProduct.currentPrice?.toString() || "0.00"}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Current price: {formatCurrency(selectedProduct.currentPrice || 0)}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity *
              </label>
              <input
                type="number"
                min="1"
                value={transactionForm.quantity}
                onChange={(e) => setTransactionForm({...transactionForm, quantity: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={transactionForm.notes}
                onChange={(e) => setTransactionForm({...transactionForm, notes: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                placeholder="Add notes about this transaction..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setIsTransactionModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Confirm {transactionForm.type === 'add' ? 'Add' : 'Deliver'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderDeleteConfirmModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-md p-6">
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Product</h3>
          <p className="text-gray-600">
            Are you sure you want to delete this product? This action cannot be undone.
          </p>
        </div>
        
        <div className="flex justify-center space-x-3">
          <button
            onClick={() => setIsDeleteConfirmOpen(false)}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => productToDelete && handleDeleteProduct(productToDelete)}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Delete Product
          </button>
        </div>
      </div>
    </div>
  );

  // ============ MAIN RENDER ============
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
            <p className="text-gray-600 mt-2">
              {user.role === 'admin' 
                ? 'Manage all products in inventory'
                : user.role === 'manager'
                ? 'Manage inventory for your department'
                : 'View and manage your inventory'
              }
            </p>
          </div>
          
          <div className="flex space-x-3 mt-4 md:mt-0">
            {canAddProduct() && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Product
              </button>
            )}
            <button
              onClick={handleExportCSV}
              disabled={isExporting}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center"
            >
              <Download className="w-5 h-5 mr-2" />
              {isExporting ? 'Exporting...' : 'Export Excel'}
            </button>
            {canViewTransactions() && (
              <button
                onClick={() => setShowTransactions(!showTransactions)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center"
              >
                {showTransactions ? <EyeOff className="w-5 h-5 mr-2" /> : <Eye className="w-5 h-5 mr-2" />}
                {showTransactions ? 'Hide History' : 'Show History'}
              </button>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">₹{stats.totalValue}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-gray-900">{stats.lowStock}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-gray-900">{stats.outOfStock}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products by name, SKU, category, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
            
            <div className="flex space-x-3">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              
              <select
                value={filterStock}
                onChange={(e) => setFilterStock(e.target.value as StockFilter)}
                className="px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="all">All Stock</option>
                <option value="low">Low Stock</option>
                <option value="out">Out of Stock</option>
                <option value="normal">Normal Stock</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transactions History */}
        {showTransactions && canViewTransactions() && (
          <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Recent Transactions</h2>
              <div className="flex space-x-3">
                {canDeleteTransactions() && (
                  <button
                    onClick={handleDeleteAllTransactions}
                    disabled={isDeletingTransactions}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDeletingTransactions ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete All Transactions
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={() => setShowTransactions(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center text-sm"
                >
                  <X className="w-4 h-4 mr-2" />
                  Close
                </button>
              </div>
            </div>
            
            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No transactions found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Product</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Type</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Quantity</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Amount</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Date</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 10).map((transaction) => (
                      <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">{transaction.productName}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            transaction.type === 'add' 
                              ? 'bg-green-100 text-green-800' 
                              : transaction.type === 'deliver'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {transaction.type === 'add' ? 'Add' : 
                             transaction.type === 'deliver' ? 'Deliver' : 'Delete'}
                          </span>
                        </td>
                        <td className="py-3 px-4">{transaction.quantity}</td>
                        <td className="py-3 px-4">₹{transaction.totalAmount}</td>
                        <td className="py-3 px-4">{formatDate(transaction.createdAt)}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{transaction.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4 text-center text-sm text-gray-600">
                  Showing {Math.min(transactions.length, 10)} of {transactions.length} transactions
                </div>
              </div>
            )}
          </div>
        )}

        {/* Products Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-4 px-6 text-left">
                    <button
                      onClick={() => {
                        setSortField('name');
                        setSortDirection(sortField === 'name' && sortDirection === 'asc' ? 'desc' : 'asc');
                      }}
                      className="flex items-center font-semibold text-gray-700 hover:text-gray-900"
                    >
                      Product
                      {sortField === 'name' && (
                        sortDirection === 'asc' ? 
                          <ChevronUp className="w-4 h-4 ml-1" /> : 
                          <ChevronDown className="w-4 h-4 ml-1" />
                      )}
                    </button>
                  </th>
                  <th className="py-4 px-6 text-left">
                    <button
                      onClick={() => {
                        setSortField('category');
                        setSortDirection(sortField === 'category' && sortDirection === 'asc' ? 'desc' : 'asc');
                      }}
                      className="flex items-center font-semibold text-gray-700 hover:text-gray-900"
                    >
                      Category
                      {sortField === 'category' && (
                        sortDirection === 'asc' ? 
                          <ChevronUp className="w-4 h-4 ml-1" /> : 
                          <ChevronDown className="w-4 h-4 ml-1" />
                      )}
                    </button>
                  </th>
                  <th className="py-4 px-6 text-left">
                    <button
                      onClick={() => {
                        setSortField('totalQuantity');
                        setSortDirection(sortField === 'totalQuantity' && sortDirection === 'asc' ? 'desc' : 'asc');
                      }}
                      className="flex items-center font-semibold text-gray-700 hover:text-gray-900"
                    >
                      Quantity
                      {sortField === 'totalQuantity' && (
                        sortDirection === 'asc' ? 
                          <ChevronUp className="w-4 h-4 ml-1" /> : 
                          <ChevronDown className="w-4 h-4 ml-1" />
                      )}
                    </button>
                  </th>
                  <th className="py-4 px-6 text-left">
                    <button
                      onClick={() => {
                        setSortField('currentPrice');
                        setSortDirection(sortField === 'currentPrice' && sortDirection === 'asc' ? 'desc' : 'asc');
                      }}
                      className="flex items-center font-semibold text-gray-700 hover:text-gray-900"
                    >
                      Price
                      {sortField === 'currentPrice' && (
                        sortDirection === 'asc' ? 
                          <ChevronUp className="w-4 h-4 ml-1" /> : 
                          <ChevronDown className="w-4 h-4 ml-1" />
                      )}
                    </button>
                  </th>
                  <th className="py-4 px-6 text-left">
                    <button
                      onClick={() => {
                        setSortField('totalValue');
                        setSortDirection(sortField === 'totalValue' && sortDirection === 'asc' ? 'desc' : 'asc');
                      }}
                      className="flex items-center font-semibold text-gray-700 hover:text-gray-900"
                    >
                      Total Value
                      {sortField === 'totalValue' && (
                        sortDirection === 'asc' ? 
                          <ChevronUp className="w-4 h-4 ml-1" /> : 
                          <ChevronDown className="w-4 h-4 ml-1" />
                      )}
                    </button>
                  </th>
                  <th className="py-4 px-6 text-left">Status</th>
                  <th className="py-4 px-6 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => {
                    const canEdit = canEditProduct(product);
                    const canDelete = canDeleteProduct(product);
                    
                    return (
                      <React.Fragment key={product.id}>
                        <tr 
                          className={`border-b border-gray-100 hover:bg-gray-50 ${
                            expandedProductId === product.id ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => setExpandedProductId(expandedProductId === product.id ? null : product.id)}
                        >
                          <td className="py-4 px-6">
                            <div>
                              <div className="font-medium text-gray-900">{product.name}</div>
                              {product.sku && (
                                <div className="text-sm text-gray-500">{product.sku}</div>
                              )}
                              {product.description && (
                                <div className="text-sm text-gray-600 truncate max-w-xs">{product.description}</div>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800">
                              <Tag className="w-3 h-3 mr-1" />
                              {product.category}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-medium">
                              {product.totalQuantity}
                            </div>
                            <div className="text-sm text-gray-500">
                              Low: {product.lowStockThreshold}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-medium">{formatCurrency(product.currentPrice || 0)}</div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-bold">{formatCurrency(product.totalValue)}</div>
                          </td>
                          <td className="py-4 px-6">
                            {renderStockBadge(product)}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedProduct(product);
                                  setTransactionForm({
                                    type: 'add',
                                    quantity: 0,
                                    price: product.currentPrice || 0,
                                    notes: '',
                                  });
                                  setIsTransactionModalOpen(true);
                                }}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="Add/Deliver Stock"
                              >
                                <Truck className="w-4 h-4" />
                              </button>
                              {canEdit && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedProduct(product);
                                    setEditForm({
                                      name: product.name,
                                      category: product.category,
                                      description: product.description,
                                      lowStockThreshold: product.lowStockThreshold,
                                    });
                                    setIsEditModalOpen(true);
                                  }}
                                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                  title="Edit"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setProductToDelete(product.id);
                                    setIsDeleteConfirmOpen(true);
                                  }}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => setExpandedProductId(expandedProductId === product.id ? null : product.id)}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                              >
                                {expandedProductId === product.id ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                        
                        {/* Expanded Details - Show Stock Entries */}
                        {expandedProductId === product.id && (
                          <tr className="bg-gray-50">
                            <td colSpan={7} className="px-6 py-4">
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-3">Stock Entries</h4>
                                <div className="overflow-x-auto">
                                  <table className="w-full border-collapse">
                                    <thead>
                                      <tr className="border-b border-gray-200">
                                        <th className="py-2 px-4 text-left text-sm font-medium text-gray-700">Date Added</th>
                                        <th className="py-2 px-4 text-left text-sm font-medium text-gray-700">Quantity</th>
                                        <th className="py-2 px-4 text-left text-sm font-medium text-gray-700">Unit Price</th>
                                        <th className="py-2 px-4 text-left text-sm font-medium text-gray-700">Total Price</th>
                                        <th className="py-2 px-4 text-left text-sm font-medium text-gray-700">Added By</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {(product.stockEntries || []).map((entry, index) => (
                                        <tr key={index} className="border-b border-gray-100 hover:bg-white">
                                          <td className="py-2 px-4">
                                            <div className="flex items-center text-gray-600">
                                              <Calendar className="w-3 h-3 mr-2" />
                                              {entry.date instanceof Timestamp 
                                                ? formatDateTime(entry.date)
                                                : formatDateTime(new Date(entry.date))}
                                            </div>
                                          </td>
                                          <td className="py-2 px-4">{entry.quantity}</td>
                                          <td className="py-2 px-4">{formatCurrency(entry.unitPrice)}</td>
                                          <td className="py-2 px-4 font-medium">{formatCurrency(entry.totalPrice)}</td>
                                          <td className="py-2 px-4">{entry.addedByName}</td>
                                        </tr>
                                      ))}
                                      {(!product.stockEntries || product.stockEntries.length === 0) && (
                                        <tr>
                                          <td colSpan={5} className="py-4 text-center text-gray-500">
                                            No stock entries found
                                          </td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                                
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  <h4 className="font-semibold text-gray-900 mb-3">Quick Actions</h4>
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      onClick={() => {
                                        setSelectedProduct(product);
                                        setTransactionForm({
                                          type: 'add',
                                          quantity: 10,
                                          price: product.currentPrice || 0,
                                          notes: 'Bulk restock'
                                        });
                                        setIsTransactionModalOpen(true);
                                      }}
                                      className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center"
                                    >
                                      <Plus className="w-4 h-4 mr-2" />
                                      Add 10 units
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSelectedProduct(product);
                                        setTransactionForm({
                                          type: 'deliver',
                                          quantity: 1,
                                          price: 0,
                                          notes: 'Single delivery'
                                        });
                                        setIsTransactionModalOpen(true);
                                      }}
                                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center"
                                    >
                                      <Truck className="w-4 h-4 mr-2" />
                                      Deliver 1 unit
                                    </button>
                                    {canEdit && (
                                      <button
                                        onClick={() => {
                                          setSelectedProduct(product);
                                          setEditForm({
                                            name: product.name,
                                            category: product.category,
                                            description: product.description,
                                            lowStockThreshold: product.lowStockThreshold,
                                          });
                                          setIsEditModalOpen(true);
                                        }}
                                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center"
                                      >
                                        <Edit2 className="w-4 h-4 mr-2" />
                                        Edit Product
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <div className="text-center">
                        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
                        <p className="text-gray-600 mb-4">
                          {searchTerm || filterCategory !== 'all' || filterStock !== 'all'
                            ? 'Try changing your search or filter criteria'
                            : canAddProduct()
                            ? 'Start by adding your first product'
                            : 'No products in inventory yet'}
                        </p>
                        {canAddProduct() && !searchTerm && filterCategory === 'all' && filterStock === 'all' && (
                          <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            Add Your First Product
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isAddModalOpen && renderAddProductModal()}
      {isEditModalOpen && renderEditProductModal()}
      {isTransactionModalOpen && renderTransactionModal()}
      {isDeleteConfirmOpen && renderDeleteConfirmModal()}
    </div>
  );
};

export default InventoryManagement;