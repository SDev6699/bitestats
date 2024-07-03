import React, { useEffect } from 'react';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TextField, Box } from '@mui/material';
import dayjs from 'dayjs';

const DateRangePickerComponent = ({ dateRange, setDateRange, orders }) => {
  useEffect(() => {
    if (orders.length > 0) {
      const firstOrderDate = dayjs(orders[0].date);
      const todayDate = dayjs(new Date());
      setDateRange([firstOrderDate, todayDate]);
    }
  }, [orders, setDateRange]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box display="flex" alignItems="center">
        <DatePicker
          label="Start Date"
          value={dateRange[0]}
          onChange={(newValue) => setDateRange([newValue, dateRange[1]])}
          renderInput={(params) => <TextField {...params} />}
        />
        <Box sx={{ mx: 2, fontFamily: 'Roboto' }}> to </Box>
        <DatePicker
          label="End Date"
          value={dateRange[1]}
          onChange={(newValue) => setDateRange([dateRange[0], newValue])}
          renderInput={(params) => <TextField {...params} />}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default DateRangePickerComponent;