import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Stack,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Chip,
} from '@mui/material';
import {
  DataGrid,
  GridApi,
  GridColDef,
  GridRenderCellParams,
  useGridApiRef,
} from '@mui/x-data-grid';
import { SelectChangeEvent } from '@mui/material/Select';
import CustomDataGridFooter from 'components/common/table/CustomDataGridFooter';
import CustomDataGridHeader from 'components/common/table/CustomDataGridHeader';
import CustomDataGridNoRows from 'components/common/table/CustomDataGridNoRows';
import dayjs from 'dayjs';
import SimpleBar from 'simplebar-react';
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  stock_quantity: number;
  description: string;
  status: string;
  created_at: string;
}

const emptyProduct: Omit<Product, 'id' | 'created_at'> = {
  name: '',
  price: 0,
  category: '',
  stock_quantity: 0,
  description: '',
  status: 'active',
};

const ProductsPage = () => {
  const [rows, setRows] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchText, setSearchText] = useState('');
  const [addOpen, setAddOpen] = useState<boolean>(false);
  const [editOpen, setEditOpen] = useState<boolean>(false);
  const [formValues, setFormValues] = useState<Omit<Product, 'id' | 'created_at'>>(emptyProduct);
  const [editId, setEditId] = useState<number | null>(null);

  const apiRef = useGridApiRef<GridApi>();

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setRows(data);
      } else {
        console.error('Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Handle form changes
  const handleFormChange = (
    e: ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>,
  ) => {
    const { name, value } = e.target;
    if (name) {
      setFormValues((prev) => ({
        ...prev,
        [name]: name === 'price' || name === 'stock_quantity' ? Number(value) : value,
      }));
    }
  };

  // Handle select changes
  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    if (name) {
      setFormValues((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Handle form submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formValues),
      });

      if (response.ok) {
        await fetchProducts();
        setAddOpen(false);
        setFormValues(emptyProduct);
      } else {
        console.error('Failed to create product');
      }
    } catch (error) {
      console.error('Error creating product:', error);
    }
  };

  // Handle edit
  const handleEdit = async () => {
    if (editId === null) return;

    try {
      const response = await fetch(`/api/products/${editId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formValues),
      });

      if (response.ok) {
        await fetchProducts();
        setEditOpen(false);
        setEditId(null);
        setFormValues(emptyProduct);
      } else {
        console.error('Failed to update product');
      }
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchProducts();
      } else {
        console.error('Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  // Open edit dialog
  const openEditDialog = (product: Product) => {
    setFormValues({
      name: product.name,
      price: product.price,
      category: product.category,
      stock_quantity: product.stock_quantity,
      description: product.description || '',
      status: product.status,
    });
    setEditId(product.id);
    setEditOpen(true);
  };

  // Filter rows based on search text
  const filteredRows = useMemo(() => {
    if (!searchText) return rows;
    return rows.filter(
      (row) =>
        row.name.toLowerCase().includes(searchText.toLowerCase()) ||
        row.category.toLowerCase().includes(searchText.toLowerCase()) ||
        row.description?.toLowerCase().includes(searchText.toLowerCase()),
    );
  }, [rows, searchText]);

  // Define columns
  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Name', width: 200, flex: 1 },
    { field: 'category', headerName: 'Category', width: 150 },
    {
      field: 'price',
      headerName: 'Price',
      width: 100,
      valueFormatter: (value) => `$${value}`,
    },
    {
      field: 'stock_quantity',
      headerName: 'Stock',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Chip
            label={params.value}
            color={params.value > 10 ? 'success' : params.value > 0 ? 'warning' : 'error'}
            size="small"
          />
        </Box>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Chip
            label={params.value}
            color={params.value === 'active' ? 'success' : 'default'}
            size="small"
          />
        </Box>
      ),
    },
    {
      field: 'created_at',
      headerName: 'Created',
      width: 120,
      valueFormatter: (value) => dayjs(value).format('MMM DD, YYYY'),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => openEditDialog(params.row as Product)}
          >
            Edit
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={() => handleDelete(params.row.id)}
          >
            Delete
          </Button>
        </Stack>
      ),
    },
  ];

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      <CustomDataGridHeader
        title="Products"
        onAdd={() => setAddOpen(true)}
        searchText={searchText}
        onSearchChange={(e: ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)}
      />

      {loading && <LinearProgress />}

      <SimpleBar style={{ height: 'calc(100% - 120px)', width: '100%' }}>
        <DataGrid
          apiRef={apiRef}
          rows={filteredRows}
          columns={columns}
          getRowId={(row) => row.id}
          slots={{
            footer: CustomDataGridFooter,
            noRowsOverlay: CustomDataGridNoRows,
          }}
          slotProps={
            {
              footer: { total: filteredRows.length },
              noRowsOverlay: { message: 'No products found' },
            } as Record<string, unknown>
          }
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          pageSizeOptions={[5, 10, 25]}
          disableRowSelectionOnClick
          sx={{ border: 'none' }}
        />
      </SimpleBar>

      {/* Add Product Dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Product</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Stack spacing={2}>
              <TextField
                name="name"
                label="Product Name"
                value={formValues.name}
                onChange={handleFormChange}
                fullWidth
                required
                size="small"
              />
              <TextField
                name="category"
                label="Category"
                value={formValues.category}
                onChange={handleFormChange}
                fullWidth
                required
                size="small"
              />
              <TextField
                name="price"
                label="Price"
                type="number"
                value={formValues.price}
                onChange={handleFormChange}
                fullWidth
                required
                size="small"
                inputProps={{ step: '0.01', min: '0' }}
              />
              <TextField
                name="stock_quantity"
                label="Stock Quantity"
                type="number"
                value={formValues.stock_quantity}
                onChange={handleFormChange}
                fullWidth
                size="small"
                inputProps={{ min: '0' }}
              />
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formValues.status}
                  onChange={handleSelectChange}
                  label="Status"
                  sx={{ height: 40 }}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
              <TextField
                name="description"
                label="Description"
                value={formValues.description}
                onChange={(e) =>
                  setFormValues((prev) => ({ ...prev, description: e.target.value }))
                }
                fullWidth
                multiline
                minRows={6}
                maxRows={12}
                size="small"
                sx={{
                  '& .MuiInputBase-input': {
                    padding: '6px 8px',
                    fontSize: '0.9rem',
                    lineHeight: 1.4,
                  },
                  '& .MuiInputBase-root textarea': {
                    resize: 'none',
                  },
                  '& .MuiInputBase-root': {
                    alignItems: 'flex-start',
                  },
                }}
              />
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Add Product
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Product</DialogTitle>
        <DialogContent>
          <Box
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              handleEdit();
            }}
            sx={{ mt: 2 }}
          >
            <Stack spacing={2}>
              <TextField
                name="name"
                label="Product Name"
                value={formValues.name}
                onChange={handleFormChange}
                fullWidth
                required
                size="small"
              />
              <TextField
                name="category"
                label="Category"
                value={formValues.category}
                onChange={handleFormChange}
                fullWidth
                required
                size="small"
              />
              <TextField
                name="price"
                label="Price"
                type="number"
                value={formValues.price}
                onChange={handleFormChange}
                fullWidth
                required
                size="small"
                inputProps={{ step: '0.01', min: '0' }}
              />
              <TextField
                name="stock_quantity"
                label="Stock Quantity"
                type="number"
                value={formValues.stock_quantity}
                onChange={handleFormChange}
                fullWidth
                size="small"
                inputProps={{ min: '0' }}
              />
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formValues.status}
                  onChange={handleSelectChange}
                  label="Status"
                  sx={{ height: 40 }}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
              <TextField
                name="description"
                label="Description"
                value={formValues.description}
                onChange={(e) =>
                  setFormValues((prev) => ({ ...prev, description: e.target.value }))
                }
                fullWidth
                multiline
                minRows={6}
                maxRows={12}
                size="small"
                sx={{
                  '& .MuiInputBase-input': {
                    padding: '6px 8px',
                    fontSize: '0.9rem',
                    lineHeight: 1.4,
                  },
                  '& .MuiInputBase-root textarea': {
                    resize: 'none',
                  },
                  '& .MuiInputBase-root': {
                    alignItems: 'flex-start',
                  },
                }}
              />
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button onClick={handleEdit} variant="contained">
            Update Product
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductsPage;
