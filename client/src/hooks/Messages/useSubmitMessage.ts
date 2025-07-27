import { v4 } from 'uuid';
import { useCallback } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { Constants, replaceSpecialVars } from 'librechat-data-provider';
import { useChatContext, useChatFormContext, useAddedChatContext } from '~/Providers';
import { useAuthContext } from '~/hooks/AuthContext';
import store from '~/store';

const appendIndex = (index: number, value?: string) => {
  if (!value) {
    return value;
  }
  return `${value}${Constants.COMMON_DIVIDER}${index}`;
};

export default function useSubmitMessage() {
  const { user } = useAuthContext();
  const methods = useChatFormContext();
  const { ask, index, getMessages, setMessages, latestMessage } = useChatContext();
  const { addedIndex, ask: askAdditional, conversation: addedConvo } = useAddedChatContext();

  const autoSendPrompts = useRecoilValue(store.autoSendPrompts);
  const activeConvos = useRecoilValue(store.allConversationsSelector);
  const aspectRatio = useRecoilValue(store.aspectRatio);
  const style = useRecoilValue(store.style);
  const imageModel = useRecoilValue(store.imageModel);
  const setActivePrompt = useSetRecoilState(store.activePromptByIndex(index));

  const submitMessage = useCallback(
    (data?: { text: string }) => {
      if (!data) {
        return console.warn('No data provided to submitMessage');
      }

      // Ø prompt prefix: Build a clean, consolidated prefix
      let promptPrefix: string | undefined = undefined;

      // Only create a prefix if we have image-related settings to apply
      if ((aspectRatio && aspectRatio !== 'Auto') || imageModel || style) {
        const prefixParts: string[] = [];

        // Add MCP server instruction (always include if we have image settings)
        prefixParts.push(
          'If a tool or MCP server is used for image/ video generation, please always return the image or video url in the response. Keep the response short and concise.',
        );

        // Add aspect ratio instruction if specified
        if (aspectRatio && aspectRatio !== 'Auto') {
          prefixParts.push(
            `[IMPORTANT: Please use the aspect ratio of ${aspectRatio} if the user is creating an image.]`,
          );
        }

        // Add style override instruction if specified
        if (style) {
          prefixParts.push(
            `[IMPORTANT: Please use image style of ${style[0]} if the user is creating an image.]`,
          );
        }

        // Add image model override instruction if specified
        if (imageModel) {
          prefixParts.push(`[IMPORTANT: Please use and override the image model to ${imageModel} if the user is creating an image. A sample input scheme is as follows:
        {
          "prompt": "Extreme close-up of a single tiger eye, direct frontal view. Detailed iris and pupil. Sharp focus on eye texture and color. Natural lighting to capture authentic eye shine and depth. The word \\"FLUX\\" is painted over it in big, white brush strokes with visible texture.",
          "num_images": 1,
          "output_format": "jpeg",
          "aspect_ratio": "1:1"
        }]`);
        }

        promptPrefix = prefixParts.join('\n\n');
      }

      const rootMessages = getMessages();
      const isLatestInRootMessages = rootMessages?.some(
        (message) => message.messageId === latestMessage?.messageId,
      );
      if (!isLatestInRootMessages && latestMessage) {
        setMessages([...(rootMessages || []), latestMessage]);
      }

      const hasAdded = addedIndex && activeConvos[addedIndex] && addedConvo;
      const isNewMultiConvo =
        hasAdded &&
        activeConvos.every((convoId) => convoId === Constants.NEW_CONVO) &&
        !rootMessages?.length;
      const overrideConvoId = isNewMultiConvo ? v4() : undefined;
      const overrideUserMessageId = hasAdded ? v4() : undefined;
      const rootIndex = addedIndex - 1;
      const clientTimestamp = new Date().toISOString();

      ask({
        text: data.text,
        overrideConvoId: appendIndex(rootIndex, overrideConvoId),
        overrideUserMessageId: appendIndex(rootIndex, overrideUserMessageId),
        clientTimestamp,
        promptPrefix,
      });

      if (hasAdded) {
        askAdditional(
          {
            text: data.text,
            overrideConvoId: appendIndex(addedIndex, overrideConvoId),
            overrideUserMessageId: appendIndex(addedIndex, overrideUserMessageId),
            clientTimestamp,
            promptPrefix,
          },
          { overrideMessages: rootMessages },
        );
      }
      methods.reset();
    },
    [
      ask,
      methods,
      addedIndex,
      addedConvo,
      setMessages,
      getMessages,
      activeConvos,
      askAdditional,
      latestMessage,
      aspectRatio,
      style,
      imageModel,
    ],
  );

  const submitPrompt = useCallback(
    (text: string) => {
      const parsedText = replaceSpecialVars({ text, user });
      if (autoSendPrompts) {
        submitMessage({ text: parsedText });
        return;
      }

      const currentText = methods.getValues('text');
      const newText = currentText.trim().length > 1 ? `\n${parsedText}` : parsedText;
      setActivePrompt(newText);
    },
    [autoSendPrompts, submitMessage, setActivePrompt, methods, user],
  );

  return { submitMessage, submitPrompt };
}
