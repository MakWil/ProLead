import { Button, IconButton, Stack, TextField, Typography } from '@mui/material';
import { GridSlotsComponentsProps } from '@mui/x-data-grid';
import IconifyIcon from 'components/base/IconifyIcon';

interface CustomDataGridHeaderProps {
  title: string;
  searchText?: string;
  onSearchChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAdd?: () => void;
}

const CustomDataGridHeader = (props: CustomDataGridHeaderProps) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (props.onSearchChange) {
      props.onSearchChange(event as React.ChangeEvent<HTMLInputElement>);
    }
  };

  return (
    <Stack
      sx={{
        my: 1,
        alignItems: 'center',
        justifyContent: 'space-between',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 2, sm: 5.5 },
      }}
    >
      <Typography variant="h6" sx={{ flex: 1, typography: { whiteSpace: 'nowrap' } }}>
        {props.title}
      </Typography>

      <Stack direction="row" spacing={2} alignItems="center">
        <TextField
          type="text"
          size="small"
          color="secondary"
          variant="filled"
          value={props.searchText}
          onChange={handleChange}
          placeholder="Search..."
          InputProps={{
            endAdornment: (
              <IconButton
                title="Clear"
                aria-label="Clear"
                size="small"
                style={{ visibility: props.searchText ? 'visible' : 'hidden' }}
                onClick={() => props.onSearchChange?.({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>)}
              >
                <IconifyIcon icon="mdi:clear-circle" fontSize="1rem" />
              </IconButton>
            ),
          }}
        />
        {props.onAdd && (
          <Button
            variant="contained"
            startIcon={<IconifyIcon icon="mdi:plus" />}
            onClick={props.onAdd}
          >
            Add
          </Button>
        )}
      </Stack>
    </Stack>
  );
};

export default CustomDataGridHeader;
