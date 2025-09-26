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
  SelectChangeEvent,
  Card,
  CardContent,
  IconButton,
  Typography,
} from '@mui/material';
import { Delete } from '@mui/icons-material';
import {
  DataGrid,
  GridApi,
  GridColDef,
  GridRenderCellParams,
  useGridApiRef,
} from '@mui/x-data-grid';
import CustomDataGridFooter from 'components/common/table/CustomDataGridFooter';
import CustomDataGridHeader from 'components/common/table/CustomDataGridHeader';
import CustomDataGridNoRows from 'components/common/table/CustomDataGridNoRows';
import dayjs from 'dayjs';
import SimpleBar from 'simplebar-react';
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

interface Product {
  productid: number;
  idproject: number | null;
  product_name: string;
  product_description: string | null;
  product_priority: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

interface ProductProperty {
  id: number;
  productid: number;
  property_id: number;
  property_name: string;
  property_value: string;
  property_description: string;
  created_at: string;
  updated_at: string;
}

interface Property {
  property_id: number;
  property_name: string;
  property_description: string;
  property_priority: number;
}

const emptyProduct: Omit<Product, 'productid' | 'created_at'> = {
  idproject: null,
  product_name: '',
  product_description: null,
  product_priority: 0,
  start_date: null,
  end_date: null,
  updated_at: '',
};

const emptyProductProperty: Omit<ProductProperty, 'id' | 'created_at' | 'updated_at'> = {
  productid: 0,
  property_id: 0,
  property_name: '',
  property_value: '',
  property_description: '',
};

const ProductsPage = () => {
  const [rows, setRows] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchText, setSearchText] = useState('');
  const [addOpen, setAddOpen] = useState<boolean>(false);
  const [editOpen, setEditOpen] = useState<boolean>(false);
  const [formValues, setFormValues] =
    useState<Omit<Product, 'productid' | 'created_at'>>(emptyProduct);
  const [editId, setEditId] = useState<number | null>(null);
  const [productPropertyFormValues, setProductPropertyFormValues] =
    useState<Omit<ProductProperty, 'id' | 'created_at' | 'updated_at'>>(emptyProductProperty);
  const [addProductPropertyOpen, setAddProductPropertyOpen] = useState<boolean>(false);
  const [availableProperties, setAvailableProperties] = useState<Property[]>([]);
  const [productProperties, setProductProperties] = useState<ProductProperty[]>([]);
  const [propertyValues, setPropertyValues] = useState<{ [key: string]: string }>({});
  const [expandedDescriptions, setExpandedDescriptions] = useState<{ [key: number]: boolean }>({});

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

  // Fetch available properties
  const fetchAvailableProperties = useCallback(async () => {
    try {
      const response = await fetch('/api/properties');
      if (response.ok) {
        const data = await response.json();
        setAvailableProperties(data);
      } else {
        console.error('Failed to fetch properties');
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  }, []);

  // Fetch product properties for a specific product
  const fetchProductProperties = useCallback(async (productId: number) => {
    try {
      const response = await fetch(`/api/product-properties/product/${productId}`);
      if (response.ok) {
        const data = await response.json();
        setProductProperties(data);
      } else {
        console.error('Failed to fetch product properties');
      }
    } catch (error) {
      console.error('Error fetching product properties:', error);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchAvailableProperties();
  }, [fetchProducts, fetchAvailableProperties]);

  // Handle form changes
  const handleFormChange = (
    e: ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>,
  ) => {
    const { name, value } = e.target;
    if (name) {
      setFormValues((prev) => ({
        ...prev,
        [name]: name === 'product_priority' ? Number(value) : value,
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
        const newProduct = await response.json();
        console.log('Server returned new product:', newProduct);
        console.log('Available fields:', Object.keys(newProduct));

        // Save selected properties for the new product
        for (const property of availableProperties) {
          await fetch('/api/product-properties', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              product_id: newProduct.productid,
              property_id: property.property_id,
              property_name: property.property_name,
              property_value: propertyValues[property.property_id.toString()] || '', // Default empty value, user can edit later
              property_description:
                propertyValues[`description_${property.property_id.toString()}`] || '',
            }),
          });
        }
        await fetchProducts();
        setAddOpen(false);
        setFormValues(emptyProduct);
        setPropertyValues({});
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
        body: JSON.stringify({
          idProject: formValues.idproject,
          product_name: formValues.product_name,
          product_description: formValues.product_description,
          product_priority: formValues.product_priority,
          start_date: formValues.start_date,
          end_date: formValues.end_date,
        }),
      });

      if (response.ok) {
        // Get existing properties for this product
        const existingPropertiesResponse = await fetch(`/api/product-properties/product/${editId}`);
        const existingProperties = existingPropertiesResponse.ok
          ? await existingPropertiesResponse.json()
          : [];
        for (const property of availableProperties) {
          const isExisting = existingProperties.some(
            (p: ProductProperty) => p.property_id === property.property_id,
          );
          if (isExisting) {
            // Update existing property
            const existingProperty = existingProperties.find(
              (p: ProductProperty) => p.property_id === property.property_id,
            );
            if (existingProperty) {
              await fetch(`/api/product-properties/${existingProperty.id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  property_value: propertyValues[property.property_id.toString()] || '',
                }),
              });
            }
          } else {
            // Add new property
            await fetch('/api/product-properties', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                product_id: editId,
                property_id: property.property_id,
                property_name: property.property_name,
                property_value: propertyValues[property.property_id] || '',
                property_description: propertyValues[`description_${property.property_id}`] || '',
              }),
            });
          }
        }

        await fetchProducts();
        setEditOpen(false);
        setFormValues(emptyProduct);
        setEditId(null);
        setPropertyValues({}); // Clear property values
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

  // Handle edit dialog open
  const handleEditDialogOpen = async (product: Product) => {
    setFormValues({
      idproject: product.idproject,
      product_name: product.product_name,
      product_description: product.product_description,
      product_priority: product.product_priority,
      start_date: product.start_date || '',
      end_date: product.end_date || '',
      updated_at: product.updated_at,
    });
    setEditId(product.productid);

    // Load existing properties for this product
    try {
      const response = await fetch(`/api/product-properties/product/${product.productid}`);
      if (response.ok) {
        const existingProperties = await response.json();
        const propertyValues = existingProperties.reduce(
          (acc: Record<string, string>, property: ProductProperty) => {
            acc[property.property_id.toString()] = property.property_value;
            if (property.property_description) {
              acc[`description_${property.property_id.toString()}`] = property.property_description;
            }
            return acc;
          },
          {},
        );
        setPropertyValues(propertyValues);
      }
    } catch (error) {
      console.error('Error loading existing properties:', error);
    }

    setEditOpen(true);
  };

  // Filter rows based on search text
  const filteredRows = useMemo(() => {
    if (!searchText) return rows;
    return rows.filter(
      (row) =>
        row.product_name.toLowerCase().includes(searchText.toLowerCase()) ||
        row.product_description?.toLowerCase().includes(searchText.toLowerCase()),
    );
  }, [rows, searchText]);

  // Define columns
  const columns: GridColDef[] = [
    { field: 'productid', headerName: 'ID', width: 70 },
    { field: 'product_name', headerName: 'Name', width: 200, flex: 1 },
    { field: 'product_description', headerName: 'Description', width: 200 },
    {
      field: 'product_priority',
      headerName: 'Priority',
      width: 100,
    },
    {
      field: 'start_date',
      headerName: 'Start Date',
      width: 120,
      valueFormatter: (value) => dayjs(value).format('MMM DD, YYYY'),
    },
    {
      field: 'end_date',
      headerName: 'End Date',
      width: 120,
      valueFormatter: (value) => dayjs(value).format('MMM DD, YYYY'),
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
      width: 400,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => handleEditDialogOpen(params.row as Product)}
          >
            Edit
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={() => handleDelete(params.row.productid)}
          >
            Delete
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="info"
            onClick={() => {
              // Set product ID and open product properties dialog
              setProductPropertyFormValues({
                ...emptyProductProperty,
                productid: params.row.productid,
              });
              fetchProductProperties(params.row.productid);
              setAddProductPropertyOpen(true);
            }}
          >
            Add New Properties
          </Button>
        </Stack>
      ),
    },
  ];

  const handlePropertySelect = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    if (name) {
      const selectedPropertyId = Number(value);
      const selectedProperty = availableProperties.find(
        (p) => p.property_id === selectedPropertyId,
      );
      setProductPropertyFormValues((prev) => ({
        ...prev,
        [name]: selectedPropertyId,
        property_name: selectedProperty?.property_name || '',
        // Leave property_description unchanged - user will fill it manually
      }));
    }
  };

  const handleProductPropertyFormChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | { name?: string; value: unknown }>,
  ) => {
    const { name, value } = e.target;
    if (name) {
      console.log('Form change:', { name, value, currentState: productPropertyFormValues });
      setProductPropertyFormValues((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleProductPropertySubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      console.log('Submitting product property:', productPropertyFormValues);
      const response = await fetch('/api/product-properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: productPropertyFormValues.productid,
          property_id: productPropertyFormValues.property_id,
          property_name: productPropertyFormValues.property_name,
          property_value: productPropertyFormValues.property_value,
          property_description: productPropertyFormValues.property_description,
        }),
      });

      if (response.ok) {
        await fetchProductProperties(productPropertyFormValues.productid);
        setAddProductPropertyOpen(false);
        setProductPropertyFormValues(emptyProductProperty);
      } else {
        const errorData = await response.json();
        console.error('Failed to create product property:', errorData);
      }
    } catch (error) {
      console.error('Error creating product property:', error);
    }
  };
  const handlePropertyValueChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPropertyValues((prev) => ({ ...prev, [name]: value }));
  };
  const toggleDescriptionField = (propertyId: number) => {
    setExpandedDescriptions((prev) => ({
      ...prev,
      [propertyId]: !prev[propertyId],
    }));
  };
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
          getRowId={(row) => row.productid}
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
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }} id="add-product-form">
            <Stack spacing={2}>
              <TextField
                name="product_name"
                label="Product Name"
                value={formValues.product_name}
                onChange={handleFormChange}
                fullWidth
                required
                size="small"
              />
              <TextField
                name="product_description"
                label="Product Description"
                value={formValues.product_description}
                onChange={handleFormChange}
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
              <TextField
                name="product_priority"
                label="Product Priority"
                type="number"
                value={formValues.product_priority}
                onChange={handleFormChange}
                fullWidth
                required
                size="small"
                inputProps={{ min: '0' }}
              />
              <TextField
                name="start_date"
                label="Start Date"
                type="date"
                value={formValues.start_date}
                onChange={handleFormChange}
                fullWidth
                size="small"
              />
              <TextField
                name="end_date"
                label="End Date"
                type="date"
                value={formValues.end_date}
                onChange={handleFormChange}
                fullWidth
                size="small"
              />
              {availableProperties.map((property) => (
                <Box key={property.property_id} sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <TextField
                        name={property.property_id.toString()}
                        label={property.property_name}
                        value={propertyValues[property.property_id] || ''}
                        onChange={handlePropertyValueChange}
                        fullWidth
                        size="small"
                      />
                      {property.property_description && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mt: 0.5, display: 'block' }}
                        >
                          {property.property_description}
                        </Typography>
                      )}
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => toggleDescriptionField(property.property_id)}
                      color={expandedDescriptions[property.property_id] ? 'primary' : 'default'}
                      sx={{ mt: 3 }} // Add slight top margin to align with input field
                    >
                      {expandedDescriptions[property.property_id] ? '-' : '+'}
                    </IconButton>
                  </Box>
                  {expandedDescriptions[property.property_id] && (
                    <TextField
                      name={`description_${property.property_id}`}
                      label={`${property.property_name} Description`}
                      value={propertyValues[`description_${property.property_id}`] || ''}
                      onChange={(e) =>
                        setPropertyValues((prev) => ({
                          ...prev,
                          [`description_${property.property_id}`]: e.target.value,
                        }))
                      }
                      fullWidth
                      size="small"
                      multiline
                      minRows={1}
                      maxRows={3}
                      placeholder="Add optional description for this property..."
                      sx={{
                        mt: 1,
                        '& .MuiInputBase-input': {
                          padding: '4px 8px',
                          fontSize: '0.8rem',
                          lineHeight: 1.2,
                        },
                        '& .MuiInputLabel-root': {
                          fontSize: '0.8rem',
                        },
                      }}
                    />
                  )}
                </Box>
              ))}
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button type="submit" form="add-product-form" variant="contained">
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
                name="product_name"
                label="Product Name"
                value={formValues.product_name}
                onChange={handleFormChange}
                fullWidth
                required
                size="small"
              />
              <TextField
                name="product_description"
                label="Product Description"
                value={formValues.product_description}
                onChange={handleFormChange}
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
              <TextField
                name="product_priority"
                label="Product Priority"
                type="number"
                value={formValues.product_priority}
                onChange={handleFormChange}
                fullWidth
                required
                size="small"
                inputProps={{ min: '0' }}
              />
              <TextField
                name="start_date"
                label="Start Date"
                type="date"
                value={formValues.start_date}
                onChange={handleFormChange}
                fullWidth
                size="small"
              />
              <TextField
                name="end_date"
                label="End Date"
                type="date"
                value={formValues.end_date}
                onChange={handleFormChange}
                fullWidth
                size="small"
              />
              {availableProperties.map((property) => (
                <Box key={property.property_id} sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <TextField
                        name={property.property_id.toString()}
                        label={property.property_name}
                        value={propertyValues[property.property_id] || ''}
                        onChange={handlePropertyValueChange}
                        fullWidth
                        size="small"
                      />
                      {property.property_description && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mt: 0.5, display: 'block' }}
                        >
                          {property.property_description}
                        </Typography>
                      )}
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => toggleDescriptionField(property.property_id)}
                      color={expandedDescriptions[property.property_id] ? 'primary' : 'default'}
                      sx={{ mt: 0.5 }} // Add slight top margin to align with input field
                    >
                      {expandedDescriptions[property.property_id] ? '-' : '+'}
                    </IconButton>
                  </Box>
                  {expandedDescriptions[property.property_id] && (
                    <TextField
                      name={`description_${property.property_id}`}
                      label={`${property.property_name} Description`}
                      value={propertyValues[`description_${property.property_id}`] || ''}
                      onChange={handlePropertyValueChange}
                      fullWidth
                      size="small"
                      multiline
                      minRows={2}
                      maxRows={4}
                      placeholder="Add optional description for this property..."
                      sx={{ mt: 1 }}
                    />
                  )}
                </Box>
              ))}
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

      {/* Add Product Property Dialog */}
      <Dialog
        open={addProductPropertyOpen}
        onClose={() => setAddProductPropertyOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Add Product Property</DialogTitle>
        <DialogContent>
          {/* Existing Product Properties */}
          {productProperties.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Existing Properties
              </Typography>
              <Stack spacing={1}>
                {productProperties.map((property) => (
                  <Card key={property.id} variant="outlined" sx={{ py: 0.5 }}>
                    <CardContent sx={{ py: 1, px: 2 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {property.property_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {property.property_value}
                          </Typography>
                          {property.property_description && (
                            <Typography variant="caption" color="text.secondary">
                              {property.property_description}
                            </Typography>
                          )}
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => {
                            // TODO: Implement delete functionality
                            console.log('Delete property:', property.id);
                          }}
                          color="error"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Box>
          )}

          <Box
            component="form"
            onSubmit={handleProductPropertySubmit}
            id="product-property-form"
            sx={{ mt: 2 }}
          >
            <Stack spacing={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Property</InputLabel>
                <Select
                  name="property_id"
                  value={productPropertyFormValues.property_id.toString()}
                  onChange={handlePropertySelect}
                  label="Property"
                  required
                >
                  {availableProperties.map((property) => (
                    <MenuItem key={property.property_id} value={property.property_id.toString()}>
                      {property.property_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                name="property_value"
                label="Property Value"
                value={productPropertyFormValues.property_value}
                onChange={handleProductPropertyFormChange}
                fullWidth
                required
                size="small"
              />
              <TextField
                name="property_description"
                label="Property Description"
                value={productPropertyFormValues.property_description}
                onChange={handleProductPropertyFormChange}
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
          <Button onClick={() => setAddProductPropertyOpen(false)}>Cancel</Button>
          <Button variant="contained">Add Product Property</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductsPage;
