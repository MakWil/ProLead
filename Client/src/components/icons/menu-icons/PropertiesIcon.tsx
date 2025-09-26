import { SvgIcon, SvgIconProps } from '@mui/material';

const PropertiesIcon = (props: SvgIconProps) => {
  return (
    <SvgIcon {...props}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 2a8 8 0 100 16 8 8 0 000-16zM7 7h10v2H7V7zm0 4h10v2H7v-2zm0 4h7v2H7v-2z"
        clipRule="evenodd"
      ></path>
    </SvgIcon>
  );
};

export default PropertiesIcon;
