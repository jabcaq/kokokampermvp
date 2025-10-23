-- Generate employee_return_link for all existing contracts
UPDATE contracts 
SET employee_return_link = 'https://app.kokokamper.pl/vehicle-return?contractId=' || id || 
  '&contractNumber=' || contract_number || 
  '&vehicleModel=' || vehicle_model || 
  '&registrationNumber=' || registration_number || 
  '&startDate=' || start_date || 
  '&endDate=' || end_date
WHERE employee_return_link IS NULL;