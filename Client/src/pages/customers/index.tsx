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
} from '@mui/material';
import {
  DataGrid,
  GridApi,
  GridColDef,
  GridRenderCellParams,
  GridRowId,
  GridSlots,
  useGridApiRef,
} from '@mui/x-data-grid';
import CustomDataGridFooter from 'components/common/table/CustomDataGridFooter';
import CustomDataGridHeader from 'components/common/table/CustomDataGridHeader';
import CustomDataGridNoRows from 'components/common/table/CustomDataGridNoRows';
import dayjs from 'dayjs';
import SimpleBar from 'simplebar-react';
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

type User = {
  id: number;
  name: string;
  age: number | null;
  date_of_birth: string | null; // ISO string (YYYY-MM-DD)
  favorite_food: string | null;
};

const emptyUser: Omit<User, 'id'> = {
  name: '',
  age: null,
  date_of_birth: null,
  favorite_food: null,
};

const CustomersPage = () => {
  const [rows, setRows] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchText, setSearchText] = useState('');
  const [addOpen, setAddOpen] = useState<boolean>(false);
  const [editOpen, setEditOpen] = useState<boolean>(false);
  const [formValues, setFormValues] = useState<Omit<User, 'id'>>(emptyUser);
  const [editId, setEditId] = useState<number | null>(null);
  const apiRef = useGridApiRef<GridApi>();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      const data: User[] = await res.json();
      setRows(data);
      apiRef.current.setRows(data);
    } catch (err) {
      // noop: could add a toast here
    } finally {
      setLoading(false);
    }
  }, [apiRef]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    apiRef.current.setQuickFilterValues([searchText]);
  }, [searchText, apiRef]);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value;
    setSearchText(value);
    if (value === '') {
      apiRef.current.setRows(rows);
    }
  };

  const handleOpenAdd = () => {
    setFormValues(emptyUser);
    setAddOpen(true);
  };

  const handleCloseAdd = () => setAddOpen(false);
  const handleCloseEdit = () => {
    setEditOpen(false);
    setEditId(null);
  };

  const handleFormChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormValues((prev) => {
      if (name === 'age') {
        return { ...prev, [name]: value === '' ? null : Number(value) };
      }
      if (name === 'date_of_birth') {
        return { ...prev, [name]: value === '' ? null : value };
      }
      return { ...prev, [name]: value };
    });
  };

  const submitAdd = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formValues),
      });
      if (!res.ok) throw new Error('Failed to create');
      handleCloseAdd();
      await fetchUsers();
    } catch (_) {
      // noop
    }
  };

  const submitEdit = async (event: FormEvent) => {
    event.preventDefault();
    if (editId == null) return;
    try {
      const res = await fetch(`/api/users/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formValues),
      });
      if (!res.ok) throw new Error('Failed to update');
      handleCloseEdit();
      await fetchUsers();
    } catch (_) {
      // noop
    }
  };

  const handleDelete = async (id: GridRowId) => {
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      await fetchUsers();
    } catch (_) {
      // noop
    }
  };

  const beginEdit = (row: User) => {
    setEditId(row.id);
    setFormValues({
      name: row.name ?? '',
      age: row.age ?? null,
      date_of_birth: row.date_of_birth ? dayjs(row.date_of_birth).format('YYYY-MM-DD') : null,
      favorite_food: row.favorite_food ?? null,
    });
    setEditOpen(true);
  };

  const columns: GridColDef<User>[] = useMemo(
    () => [
      { field: 'id', headerName: 'ID', width: 80 },
      { field: 'name', headerName: 'Name', minWidth: 160, flex: 1 },
      { field: 'age', headerName: 'Age', width: 100 },
      {
        field: 'date_of_birth',
        headerName: 'Date of Birth',
        minWidth: 160,
        valueFormatter: (value) => (value ? dayjs(value as string).format('DD.MM.YYYY') : ''),
      },
      { field: 'favorite_food', headerName: 'Favorite Food', minWidth: 160, flex: 1 },
      {
        field: 'actions',
        headerName: 'Actions',
        sortable: false,
        filterable: false,
        width: 160,
        renderCell: (params: GridRenderCellParams<User>) => {
          return (
            <Stack direction="row" spacing={1}>
              <Button size="small" variant="outlined" onClick={() => beginEdit(params.row)}>
                Edit
              </Button>
              <Button
                size="small"
                color="error"
                variant="outlined"
                onClick={() => handleDelete(params.row.id)}
              >
                Delete
              </Button>
            </Stack>
          );
        },
      },
    ],
    [],
  );

  return (
    <Stack sx={{ gap: 2 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ sm: 'center' }}
        justifyContent="space-between"
      >
        <Box />
        <Button variant="contained" onClick={handleOpenAdd}>
          Add User
        </Button>
      </Stack>

      <Box
        sx={{
          overflow: 'hidden',
          minHeight: 0,
          position: 'relative',
          height: { xs: 'auto', sm: 1 },
        }}
      >
        <SimpleBar>
          <DataGrid
            autoHeight={false}
            rowHeight={52}
            columns={columns}
            loading={loading}
            apiRef={apiRef}
            onResize={() => {
              apiRef.current.autosizeColumns({ includeOutliers: true, expand: true });
            }}
            hideFooterSelectedRowCount
            disableColumnResize
            disableColumnMenu
            disableColumnSelector
            disableRowSelectionOnClick
            rowSelection={false}
            slots={{
              loadingOverlay: LinearProgress as GridSlots['loadingOverlay'],
              pagination: CustomDataGridFooter,
              toolbar: CustomDataGridHeader,
              noResultsOverlay: CustomDataGridNoRows,
            }}
            slotProps={{
              toolbar: {
                title: 'Customers',
                flag: 'customers',
                value: searchText,
                onChange: handleSearchChange,
                clearSearch: () => setSearchText(''),
              },
              pagination: { labelRowsPerPage: rows.length },
            }}
            initialState={{ pagination: { paginationModel: { page: 1, pageSize: 10 } } }}
            pageSizeOptions={[5, 10, 25]}
            sx={{
              boxShadow: 1,
              px: 3,
              borderColor: 'common.white',
              overflow: 'auto',
              height: 1,
              width: 1,
            }}
          />
        </SimpleBar>
      </Box>

      <Dialog
        open={addOpen}
        onClose={handleCloseAdd}
        fullWidth
        maxWidth="sm"
        component="form"
        onSubmit={submitAdd}
      >
        <DialogTitle>Add User</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'grid', gap: 2 }}>
          <TextField
            label="Name"
            name="name"
            value={formValues.name}
            onChange={handleFormChange}
            required
          />
          <TextField
            label="Age"
            name="age"
            type="number"
            value={formValues.age ?? ''}
            onChange={handleFormChange}
          />
          <TextField
            label="Date of Birth"
            name="date_of_birth"
            type="date"
            value={formValues.date_of_birth ?? ''}
            onChange={handleFormChange}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Favorite Food"
            name="favorite_food"
            value={formValues.favorite_food ?? ''}
            onChange={handleFormChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAdd}>Cancel</Button>
          <Button type="submit" variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={editOpen}
        onClose={handleCloseEdit}
        fullWidth
        maxWidth="sm"
        component="form"
        onSubmit={submitEdit}
      >
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'grid', gap: 2 }}>
          <TextField
            label="Name"
            name="name"
            value={formValues.name}
            onChange={handleFormChange}
            required
          />
          <TextField
            label="Age"
            name="age"
            type="number"
            value={formValues.age ?? ''}
            onChange={handleFormChange}
          />
          <TextField
            label="Date of Birth"
            name="date_of_birth"
            type="date"
            value={formValues.date_of_birth ?? ''}
            onChange={handleFormChange}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Favorite Food"
            name="favorite_food"
            value={formValues.favorite_food ?? ''}
            onChange={handleFormChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEdit}>Cancel</Button>
          <Button type="submit" variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

export default CustomersPage;
