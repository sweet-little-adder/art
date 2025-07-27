import React, { memo, useMemo, useRef, useState, useCallback } from 'react';
import * as Ariakit from '@ariakit/react';
import { Image, Zap, Sparkles, Clock } from 'lucide-react';
import { useRecoilState } from 'recoil';
import DropdownPopup from '~/components/ui/DropdownPopup';
import type { MenuItemProps } from '~/common';
import store from '~/store';

function ImageModelSelect() {
  const triggerRef = useRef<HTMLButtonElement>(null);

  const [imageModel, setImageModel] = useRecoilState(store.imageModel);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const getDisplayValue = useCallback((model: string) => {
    switch (model) {
      case 'fal-ai/flux-pro/kontext/text-to-image':
        return 'Flux Kontext [PRO]';
      case 'fal-ai/flux-pro/kontext/max/text-to-image':
        return 'Flux Kontext [MAX]';
      case 'fal-ai/imagen4/preview/ultra':
        return 'Imagen 4 [ULTRA]';
      case 'fal-ai/imagen4/preview/fast':
        return 'Imagen 4 [FAST]';
      default:
        return model;
    }
  }, []);

  const imageModelItems: MenuItemProps[] = useMemo(
    () => [
      {
        id: 'fal-ai/flux-pro/kontext/text-to-image',
        label: 'Flux Kontext [PRO]',
        icon: <Zap className="icon-sm" />,
        onClick: () => {
          setImageModel('fal-ai/flux-pro/kontext/text-to-image');
        },
        className:
          imageModel === 'fal-ai/flux-pro/kontext/text-to-image' ? 'bg-surface-tertiary' : '',
      },
      {
        id: 'fal-ai/flux-pro/kontext/max/text-to-image',
        label: 'Flux Kontext [MAX]',
        icon: <Sparkles className="icon-sm" />,
        onClick: () => {
          setImageModel('fal-ai/flux-pro/kontext/max/text-to-image');
        },
        className:
          imageModel === 'fal-ai/flux-pro/kontext/max/text-to-image' ? 'bg-surface-tertiary' : '',
      },
      {
        id: 'fal-ai/imagen4/preview/ultra',
        label: 'Imagen 4 [ULTRA]',
        icon: <Image className="icon-sm" />,
        onClick: () => {
          setImageModel('fal-ai/imagen4/preview/ultra');
        },
        className: imageModel === 'fal-ai/imagen4/preview/ultra' ? 'bg-surface-tertiary' : '',
      },
      {
        id: 'fal-ai/imagen4/preview/fast',
        label: 'Imagen 4 [FAST]',
        icon: <Clock className="icon-sm" />,
        onClick: () => {
          setImageModel('fal-ai/imagen4/preview/fast');
        },
        className: imageModel === 'fal-ai/imagen4/preview/fast' ? 'bg-surface-tertiary' : '',
      },
    ],
    [imageModel, setImageModel],
  );

  const SelectedIcon = useMemo(() => {
    switch (imageModel) {
      case 'fal-ai/flux-pro/kontext/text-to-image':
        return Zap;
      case 'fal-ai/flux-pro/kontext/max/text-to-image':
        return Sparkles;
      case 'fal-ai/imagen4/preview/ultra':
        return Image;
      case 'fal-ai/imagen4/preview/fast':
        return Clock;
      default:
        return Image;
    }
  }, [imageModel]);

  return (
    <DropdownPopup
      trigger={
        <Ariakit.MenuButton
          ref={triggerRef}
          className="badge-icon group/ relative inline-flex min-w-fit items-center justify-center gap-1.5 rounded-full border border-border-medium bg-transparent px-2 py-2 text-sm font-medium shadow-sm transition-all hover:bg-surface-hover hover:shadow-md active:shadow-inner md:min-w-fit md:justify-start md:px-3"
          aria-label="Select Image Model"
        >
          <SelectedIcon className="icon-md" />
          <span className="hidden md:block">
            <div className="flex items-center">{getDisplayValue(imageModel)}</div>
          </span>
        </Ariakit.MenuButton>
      }
      items={imageModelItems}
      isOpen={isDropdownOpen}
      setIsOpen={setIsDropdownOpen}
      menuId="image-model-menu"
      gutter={8}
      className="min-w-fit"
      portal={true}
      modal={true}
      unmountOnHide={true}
    />
  );
}

export default memo(ImageModelSelect);
