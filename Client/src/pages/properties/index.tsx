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
  Chip,
} from '@mui/material';
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

interface Property {
  property_id: number;
  property_name: string;
  property_description: string;
  property_priority: number;
  created_at: string;
  updated_at: string;
}

const emptyProperty: Omit<Property, 'property_id' | 'created_at' | 'updated_at'> = {
  property_name: '',
  property_description: '',
  property_priority: 0,
};

const PropertiesPage = () => {
  const [rows, setRows] = useState<Property[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchText, setSearchText] = useState('');
  const [addOpen, setAddOpen] = useState<boolean>(false);
  const [editOpen, setEditOpen] = useState<boolean>(false);
  const [formValues, setFormValues] =
    useState<Omit<Property, 'property_id' | 'created_at' | 'updated_at'>>(emptyProperty);
  const [editId, setEditId] = useState<number | null>(null);

  const apiRef = useGridApiRef<GridApi>();

  // Fetch properties
  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/properties');
      if (response.ok) {
        const data = await response.json();
        setRows(data);
      } else {
        console.error('Failed to fetch properties');
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Handle form changes
  const handleFormChange = (
    e: ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>,
  ) => {
    const { name, value } = e.target;
    if (name) {
      setFormValues((prev) => ({
        ...prev,
        [name]: name === 'property_priority' ? Number(value) : value,
      }));
    }
  };

  // Handle form submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formValues),
      });

      if (response.ok) {
        await fetchProperties();
        setAddOpen(false);
        setFormValues(emptyProperty);
      } else {
        console.error('Failed to create property');
      }
    } catch (error) {
      console.error('Error creating property:', error);
    }
  };

  // Handle edit
  const handleEdit = async () => {
    if (editId === null) return;

    try {
      const response = await fetch(`/api/properties/${editId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formValues),
      });

      if (response.ok) {
        await fetchProperties();
        setEditOpen(false);
        setEditId(null);
        setFormValues(emptyProperty);
      } else {
        console.error('Failed to update property');
      }
    } catch (error) {
      console.error('Error updating property:', error);
    }
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this property?')) return;

    try {
      const response = await fetch(`/api/properties/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchProperties();
      } else {
        console.error('Failed to delete property');
      }
    } catch (error) {
      console.error('Error deleting property:', error);
    }
  };

  // Open edit dialog
  const openEditDialog = (property: Property) => {
    setFormValues({
      property_name: property.property_name,
      property_description: property.property_description,
      property_priority: property.property_priority,
    });
    setEditId(property.property_id);
    setEditOpen(true);
  };

  // Filter rows based on search text
  const filteredRows = useMemo(() => {
    if (!searchText) return rows;
    return rows.filter(
      (row) =>
        row.property_name.toLowerCase().includes(searchText.toLowerCase()) ||
        row.property_description?.toLowerCase().includes(searchText.toLowerCase()),
    );
  }, [rows, searchText]);

  // Define columns
  const columns: GridColDef[] = [
    {
      field: 'property_id',
      headerName: 'ID',
      width: 80,
      sortable: true,
    },
    {
      field: 'property_name',
      headerName: 'Property Name',
      width: 200,
      flex: 1,
    },
    {
      field: 'property_description',
      headerName: 'Description',
      width: 300,
      flex: 1,
      renderCell: (params: GridRenderCellParams) => (
        <Box
          sx={{
            maxWidth: 300,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {params.value || '-'}
        </Box>
      ),
    },
    {
      field: 'property_priority',
      headerName: 'Priority',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Chip
            label={params.value}
            color={
              params.value === 1
                ? 'error'
                : params.value === 2
                  ? 'warning'
                  : params.value === 3
                    ? 'info'
                    : 'default'
            }
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
      field: 'updated_at',
      headerName: 'Updated',
      width: 120,
      valueFormatter: (value) => dayjs(value).format('MMM DD, YYYY'),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 250,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => openEditDialog(params.row as Property)}
          >
            Edit
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={() => handleDelete(params.row.property_id)}
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
        title="Properties"
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
          getRowId={(row) => row.property_id}
          slots={{
            footer: CustomDataGridFooter,
            noRowsOverlay: CustomDataGridNoRows,
          }}
          slotProps={
            {
              footer: { total: filteredRows.length },
              noRowsOverlay: { message: 'No properties found' },
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

      {/* Add Property Dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Property</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Stack spacing={2}>
              <TextField
                name="property_name"
                label="Property Name"
                value={formValues.property_name}
                onChange={handleFormChange}
                fullWidth
                required
                size="small"
              />
              <TextField
                name="property_description"
                label="Property Description"
                value={formValues.property_description}
                onChange={(e) =>
                  setFormValues((prev) => ({ ...prev, property_description: e.target.value }))
                }
                fullWidth
                multiline
                minRows={4}
                maxRows={8}
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
                name="property_priority"
                label="Priority"
                type="number"
                value={formValues.property_priority}
                onChange={handleFormChange}
                fullWidth
                size="small"
                inputProps={{ min: '0' }}
                helperText="Lower numbers indicate higher priority"
              />
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Add Property
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Property Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Property</DialogTitle>
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
                name="property_name"
                label="Property Name"
                value={formValues.property_name}
                onChange={handleFormChange}
                fullWidth
                required
                size="small"
              />
              <TextField
                name="property_description"
                label="Property Description"
                value={formValues.property_description}
                onChange={(e) =>
                  setFormValues((prev) => ({ ...prev, property_description: e.target.value }))
                }
                fullWidth
                multiline
                minRows={4}
                maxRows={8}
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
                name="property_priority"
                label="Priority"
                type="number"
                value={formValues.property_priority}
                onChange={handleFormChange}
                fullWidth
                size="small"
                inputProps={{ min: '0' }}
                helperText="Lower numbers indicate higher priority"
              />
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button onClick={handleEdit} variant="contained">
            Update Property
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PropertiesPage;
