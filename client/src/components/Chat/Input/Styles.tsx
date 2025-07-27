import { EModelEndpoint } from 'librechat-data-provider';
import { Palette, X } from 'lucide-react';
import { memo, useCallback, useEffect, useRef } from 'react';
import { useRecoilState } from 'recoil';
import StyleDialog from '~/components/SidePanel/Agents/Search/StyleDialog';
import CheckboxButton from '~/components/ui/CheckboxButton';
import { useCodeApiKeyForm, useFileHandling, useLocalize } from '~/hooks';
import store from '~/store';

function Styles() {
  const triggerRef = useRef<HTMLInputElement>(null);
  const localize = useLocalize();
  const { handleFiles, setFiles } = useFileHandling({ overrideEndpoint: EModelEndpoint.agents });
  const { onSubmit, isDialogOpen, setIsDialogOpen } = useCodeApiKeyForm({});
  const [style, setStyle] = useRecoilState(store.style);

  useEffect(() => {
    setStyle(null);
  }, [setStyle]);

  const handleStyleSelectFromDialog = useCallback(
    async (imageUrl: string, styleName: string) => {
      setFiles(new Map());
      setStyle([styleName, imageUrl]);
      console.log('imageUrl:', imageUrl);
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();

        const file = new File([blob], `selected-image-${Date.now()}.jpg`, {
          type: 'image/jpeg',
        });

        await handleFiles([file]);
        setIsDialogOpen(false);
      } catch (error) {
        console.error('Error selecting image:', error);
      }
    },
    [handleFiles, setIsDialogOpen, setStyle, setFiles],
  );

  return (
    <div className="relative">
      <CheckboxButton
        ref={triggerRef}
        className={`min-w-9 ${style ? 'aspect-square' : ''} max-w-fit bg-[url('${style?.[1]}')] bg-cover bg-center transition-all duration-300`}
        setValue={() => {
          setIsDialogOpen(true);
        }}
        label={!style ? localize('com_ui_styles') : ''}
        icon={
          style ? (
            <img
              src={style?.[1]}
              alt="style"
              className="z-1 absolute right-1/2 top-[-1px] aspect-square h-9 max-w-fit translate-x-1/2 rounded-full"
            />
          ) : (
            <Palette className={`icon-md ${style && 'pointer-events-none aspect-square'}`} />
          )
        }
      />
      {style && (
        <X
          className="absolute right-0 top-0 z-10 h-3 w-3 cursor-pointer rounded-full bg-black p-[2px] text-white"
          onClick={() => {
            setStyle(null);
          }}
        />
      )}
      <StyleDialog
        onSubmit={onSubmit}
        isOpen={isDialogOpen}
        triggerRef={triggerRef}
        onOpenChange={setIsDialogOpen}
        onStyleSelect={handleStyleSelectFromDialog}
      />
    </div>
  );
}

export default memo(Styles);
