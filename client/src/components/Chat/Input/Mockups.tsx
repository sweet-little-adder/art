import { EModelEndpoint } from 'librechat-data-provider';
import { Sparkles } from 'lucide-react';
import React, { memo, useCallback, useRef } from 'react';
import MockupDialog from '~/components/SidePanel/Agents/Search/MockupDialog';
import CheckboxButton from '~/components/ui/CheckboxButton';
import { useCodeApiKeyForm, useFileHandling, useLocalize } from '~/hooks';

function Mockups() {
  const triggerRef = useRef<HTMLInputElement>(null);
  const localize = useLocalize();
  const { handleFiles } = useFileHandling({ overrideEndpoint: EModelEndpoint.agents });
  const { onSubmit, isDialogOpen, setIsDialogOpen } = useCodeApiKeyForm({});

  const handleImageSelectFromDialog = useCallback(
    async (imageUrl: string) => {
      console.log('imageUrl:', imageUrl);
      try {
        // Fetch the image from URL and convert to File object
        const response = await fetch(imageUrl);
        const blob = await response.blob();

        // Create a File object from the blob
        const file = new File([blob], `selected-image-${Date.now()}.jpg`, {
          type: 'image/jpeg',
        });

        // Use handleFiles directly with the File object
        await handleFiles([file]);
        setIsDialogOpen(false);
      } catch (error) {
        console.error('Error selecting image:', error);
      }
    },
    [handleFiles, setIsDialogOpen],
  );

  return (
    <>
      <CheckboxButton
        ref={triggerRef}
        className="max-w-fit"
        setValue={() => {
          setIsDialogOpen(true);
        }}
        label={localize('com_assistants_stock')}
        icon={<Sparkles className="icon-md" />}
      />
      <MockupDialog
        onSubmit={onSubmit}
        isOpen={isDialogOpen}
        triggerRef={triggerRef}
        onOpenChange={setIsDialogOpen}
        onImageSelect={handleImageSelectFromDialog}
      />
    </>
  );
}

export default memo(Mockups);
