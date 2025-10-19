-- Aktualizacja wszystkich linków w tabeli contracts na nową domenę app.kokokamper.pl

UPDATE contracts
SET 
  handover_link = REPLACE(
    REPLACE(
      REPLACE(handover_link, 
        'https://kokokampermvp.lovable.app/', 
        'https://app.kokokamper.pl/'
      ),
      'https://id-preview--4f186cd2-c508-4437-a184-a75e93a7ce80.lovable.app/',
      'https://app.kokokamper.pl/'
    ),
    'https://4f186cd2-c508-4437-a184-a75e93a7ce80.lovableproject.com/',
    'https://app.kokokamper.pl/'
  ),
  return_link = REPLACE(
    REPLACE(
      REPLACE(return_link,
        'https://kokokampermvp.lovable.app/',
        'https://app.kokokamper.pl/'
      ),
      'https://id-preview--4f186cd2-c508-4437-a184-a75e93a7ce80.lovable.app/',
      'https://app.kokokamper.pl/'
    ),
    'https://4f186cd2-c508-4437-a184-a75e93a7ce80.lovableproject.com/',
    'https://app.kokokamper.pl/'
  ),
  driver_submission_link = REPLACE(
    REPLACE(
      REPLACE(driver_submission_link,
        'https://kokokampermvp.lovable.app/',
        'https://app.kokokamper.pl/'
      ),
      'https://id-preview--4f186cd2-c508-4437-a184-a75e93a7ce80.lovable.app/',
      'https://app.kokokamper.pl/'
    ),
    'https://4f186cd2-c508-4437-a184-a75e93a7ce80.lovableproject.com/',
    'https://app.kokokamper.pl/'
  )
WHERE 
  handover_link LIKE '%lovable%' 
  OR return_link LIKE '%lovable%' 
  OR driver_submission_link LIKE '%lovable%';