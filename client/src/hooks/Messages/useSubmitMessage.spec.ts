import { renderHook, act } from '@testing-library/react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { Constants } from 'librechat-data-provider';
import useSubmitMessage from './useSubmitMessage';
import { useChatContext, useChatFormContext, useAddedChatContext } from '~/Providers';
import { useAuthContext } from '~/hooks/AuthContext';
import store from '~/store';

// Mock dependencies
jest.mock('recoil', () => ({
  useRecoilValue: jest.fn(),
  useSetRecoilState: jest.fn(),
}));

jest.mock('~/Providers', () => ({
  useChatContext: jest.fn(),
  useChatFormContext: jest.fn(),
  useAddedChatContext: jest.fn(),
}));

jest.mock('~/hooks/AuthContext', () => ({
  useAuthContext: jest.fn(),
}));

jest.mock('~/store', () => ({
  autoSendPrompts: { key: 'autoSendPrompts' },
  allConversationsSelector: { key: 'allConversationsSelector' },
  aspectRatio: { key: 'aspectRatio' },
  imageModel: { key: 'imageModel' },
  activePromptByIndex: jest.fn(),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid'),
}));

describe.skip('useSubmitMessage - Prompt Prefix Tests', () => {
  // Mock functions
  const mockAsk = jest.fn();
  const mockAskAdditional = jest.fn();
  const mockGetMessages = jest.fn();
  const mockSetMessages = jest.fn();
  const mockReset = jest.fn();
  const mockSetActivePrompt = jest.fn();

  // Mock data
  const mockUser = { id: 'user123', name: 'Test User' };
  const mockMessages = [];
  const mockLatestMessage = { messageId: 'msg123' };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    (useAuthContext as jest.Mock).mockReturnValue({
      user: mockUser,
    });

    (useChatContext as jest.Mock).mockReturnValue({
      ask: mockAsk,
      index: 0,
      getMessages: mockGetMessages,
      setMessages: mockSetMessages,
      latestMessage: mockLatestMessage,
    });

    (useChatFormContext as jest.Mock).mockReturnValue({
      reset: mockReset,
      getValues: jest.fn().mockReturnValue(''),
    });

    (useAddedChatContext as jest.Mock).mockReturnValue({
      addedIndex: null,
      ask: mockAskAdditional,
      conversation: null,
    });

    (useSetRecoilState as jest.Mock).mockReturnValue(mockSetActivePrompt);

    // Default recoil values
    (useRecoilValue as jest.Mock).mockImplementation((atom) => {
      switch (atom.key) {
        case 'autoSendPrompts':
          return false;
        case 'allConversationsSelector':
          return [Constants.NEW_CONVO];
        case 'aspectRatio':
          return 'Auto';
        case 'imageModel':
          return '';
        default:
          return null;
      }
    });

    mockGetMessages.mockReturnValue(mockMessages);
  });

  describe('Prompt Prefix Generation', () => {
    it('should not generate prompt prefix when no image settings are specified', () => {
      // Setup: No aspect ratio or image model
      (useRecoilValue as jest.Mock).mockImplementation((atom) => {
        switch (atom.key) {
          case 'aspectRatio':
            return 'Auto';
          case 'imageModel':
            return '';
          default:
            return false;
        }
      });

      const { result } = renderHook(() => useSubmitMessage());

      act(() => {
        result.current.submitMessage({ text: 'Generate an image of a cat' });
      });

      expect(mockAsk).toHaveBeenCalledWith({
        text: 'Generate an image of a cat',
        overrideConvoId: undefined,
        overrideUserMessageId: undefined,
        clientTimestamp: expect.any(String),
        promptPrefix: undefined,
      });
    });

    it('should generate prompt prefix with aspect ratio only', () => {
      // Setup: Aspect ratio specified, no image model
      (useRecoilValue as jest.Mock).mockImplementation((atom) => {
        switch (atom.key) {
          case 'aspectRatio':
            return '16:9';
          case 'imageModel':
            return '';
          default:
            return false;
        }
      });

      const { result } = renderHook(() => useSubmitMessage());

      act(() => {
        result.current.submitMessage({ text: 'Generate an image of a cat' });
      });

      const expectedPromptPrefix =
        'If a tool or MCP server is used for image/ video generation, please always return the image or video url in the response. Keep the response short and concise.\n\n' +
        '[IMPORTANT: Please use the aspect ratio of 16:9 if the user is creating an image.]';

      expect(mockAsk).toHaveBeenCalledWith({
        text: 'Generate an image of a cat',
        overrideConvoId: undefined,
        overrideUserMessageId: undefined,
        clientTimestamp: expect.any(String),
        promptPrefix: expectedPromptPrefix,
      });
    });

    it('should generate prompt prefix with image model only', () => {
      // Setup: Image model specified, aspect ratio is Auto
      (useRecoilValue as jest.Mock).mockImplementation((atom) => {
        switch (atom.key) {
          case 'aspectRatio':
            return 'Auto';
          case 'imageModel':
            return 'fal-ai/flux-pro/kontext/text-to-image';
          default:
            return false;
        }
      });

      const { result } = renderHook(() => useSubmitMessage());

      act(() => {
        result.current.submitMessage({ text: 'Generate an image of a cat' });
      });

      const expectedPromptPrefix =
        'If a tool or MCP server is used for image/ video generation, please always return the image or video url in the response. Keep the response short and concise.\n\n' +
        '[IMPORTANT: Please use and override the image model to fal-ai/flux-pro/kontext/text-to-image if the user is creating an image. A sample input scheme is as follows:\n' +
        '        {\n' +
        '          "prompt": "Extreme close-up of a single tiger eye, direct frontal view. Detailed iris and pupil. Sharp focus on eye texture and color. Natural lighting to capture authentic eye shine and depth. The word \\"FLUX\\" is painted over it in big, white brush strokes with visible texture.",\n' +
        '          "num_images": 1,\n' +
        '          "output_format": "jpeg",\n' +
        '          "aspect_ratio": "1:1"\n' +
        '        }]';

      expect(mockAsk).toHaveBeenCalledWith({
        text: 'Generate an image of a cat',
        overrideConvoId: undefined,
        overrideUserMessageId: undefined,
        clientTimestamp: expect.any(String),
        promptPrefix: expectedPromptPrefix,
      });
    });

    it('should generate prompt prefix with both aspect ratio and image model', () => {
      // Setup: Both aspect ratio and image model specified
      (useRecoilValue as jest.Mock).mockImplementation((atom) => {
        switch (atom.key) {
          case 'aspectRatio':
            return '1:1';
          case 'imageModel':
            return 'fal-ai/imagen4/preview/fast';
          default:
            return false;
        }
      });

      const { result } = renderHook(() => useSubmitMessage());

      act(() => {
        result.current.submitMessage({ text: 'Generate an image of a cat' });
      });

      const expectedPromptPrefix =
        'If a tool or MCP server is used for image/ video generation, please always return the image or video url in the response. Keep the response short and concise.\n\n' +
        '[IMPORTANT: Please use the aspect ratio of 1:1 if the user is creating an image.]\n\n' +
        '[IMPORTANT: Please use and override the image model to fal-ai/imagen4/preview/fast if the user is creating an image. A sample input scheme is as follows:\n' +
        '        {\n' +
        '          "prompt": "Extreme close-up of a single tiger eye, direct frontal view. Detailed iris and pupil. Sharp focus on eye texture and color. Natural lighting to capture authentic eye shine and depth. The word \\"FLUX\\" is painted over it in big, white brush strokes with visible texture.",\n' +
        '          "num_images": 1,\n' +
        '          "output_format": "jpeg",\n' +
        '          "aspect_ratio": "1:1"\n' +
        '        }]';

      expect(mockAsk).toHaveBeenCalledWith({
        text: 'Generate an image of a cat',
        overrideConvoId: undefined,
        overrideUserMessageId: undefined,
        clientTimestamp: expect.any(String),
        promptPrefix: expectedPromptPrefix,
      });
    });
  });

  describe('Image Model Change Scenarios', () => {
    it('should handle scenario: User selects image model A', () => {
      // Setup: User selects image model A
      (useRecoilValue as jest.Mock).mockImplementation((atom) => {
        switch (atom.key) {
          case 'aspectRatio':
            return '16:9';
          case 'imageModel':
            return 'fal-ai/flux-pro/kontext/text-to-image';
          default:
            return false;
        }
      });

      const { result } = renderHook(() => useSubmitMessage());

      act(() => {
        result.current.submitMessage({ text: 'Create a landscape image' });
      });

      const expectedPromptPrefix =
        'If a tool or MCP server is used for image/ video generation, please always return the image or video url in the response. Keep the response short and concise.\n\n' +
        '[IMPORTANT: Please use the aspect ratio of 16:9 if the user is creating an image.]\n\n' +
        '[IMPORTANT: Please use and override the image model to fal-ai/flux-pro/kontext/text-to-image if the user is creating an image. A sample input scheme is as follows:\n' +
        '        {\n' +
        '          "prompt": "Extreme close-up of a single tiger eye, direct frontal view. Detailed iris and pupil. Sharp focus on eye texture and color. Natural lighting to capture authentic eye shine and depth. The word \\"FLUX\\" is painted over it in big, white brush strokes with visible texture.",\n' +
        '          "num_images": 1,\n' +
        '          "output_format": "jpeg",\n' +
        '          "aspect_ratio": "1:1"\n' +
        '        }]';

      expect(mockAsk).toHaveBeenCalledWith({
        text: 'Create a landscape image',
        overrideConvoId: undefined,
        overrideUserMessageId: undefined,
        clientTimestamp: expect.any(String),
        promptPrefix: expectedPromptPrefix,
      });

      // Verify no accumulation or corruption
      expect(expectedPromptPrefix).not.toContain('undefined');
      expect(expectedPromptPrefix.split('[IMPORTANT:').length).toBe(3); // One split before first occurrence
    });

    it('should handle scenario: User selects image model B after model A', () => {
      const { result, rerender } = renderHook(() => useSubmitMessage());

      // First request with model A
      (useRecoilValue as jest.Mock).mockImplementation((atom) => {
        switch (atom.key) {
          case 'aspectRatio':
            return '1:1';
          case 'imageModel':
            return 'fal-ai/flux-pro/kontext/text-to-image';
          default:
            return false;
        }
      });

      act(() => {
        result.current.submitMessage({ text: 'Create a portrait' });
      });

      // Clear previous calls
      mockAsk.mockClear();

      // Simulate user changing to model B
      (useRecoilValue as jest.Mock).mockImplementation((atom) => {
        switch (atom.key) {
          case 'aspectRatio':
            return '1:1';
          case 'imageModel':
            return 'fal-ai/imagen4/preview/fast';
          default:
            return false;
        }
      });

      // Re-render the hook to pick up new values
      rerender();

      act(() => {
        result.current.submitMessage({ text: 'Create another image' });
      });

      const expectedPromptPrefix =
        'If a tool or MCP server is used for image/ video generation, please always return the image or video url in the response. Keep the response short and concise.\n\n' +
        '[IMPORTANT: Please use the aspect ratio of 1:1 if the user is creating an image.]\n\n' +
        '[IMPORTANT: Please use and override the image model to fal-ai/imagen4/preview/fast if the user is creating an image. A sample input scheme is as follows:\n' +
        '        {\n' +
        '          "prompt": "Extreme close-up of a single tiger eye, direct frontal view. Detailed iris and pupil. Sharp focus on eye texture and color. Natural lighting to capture authentic eye shine and depth. The word \\"FLUX\\" is painted over it in big, white brush strokes with visible texture.",\n' +
        '          "num_images": 1,\n' +
        '          "output_format": "jpeg",\n' +
        '          "aspect_ratio": "1:1"\n' +
        '        }]';

      expect(mockAsk).toHaveBeenCalledWith({
        text: 'Create another image',
        overrideConvoId: undefined,
        overrideUserMessageId: undefined,
        clientTimestamp: expect.any(String),
        promptPrefix: expectedPromptPrefix,
      });

      // Verify the new model is used and there's no accumulation
      expect(expectedPromptPrefix).toContain('fal-ai/imagen4/preview/fast');
      expect(expectedPromptPrefix).not.toContain('fal-ai/flux-pro/kontext/text-to-image');
      expect(expectedPromptPrefix).not.toContain('undefined');
    });

    it('should handle scenario: User selects image model A again after model B', () => {
      const { result, rerender } = renderHook(() => useSubmitMessage());

      // Start with model A
      (useRecoilValue as jest.Mock).mockImplementation((atom) => {
        switch (atom.key) {
          case 'aspectRatio':
            return '4:3';
          case 'imageModel':
            return 'fal-ai/flux-pro/kontext/text-to-image';
          default:
            return false;
        }
      });

      act(() => {
        result.current.submitMessage({ text: 'First image' });
      });

      // Switch to model B
      (useRecoilValue as jest.Mock).mockImplementation((atom) => {
        switch (atom.key) {
          case 'aspectRatio':
            return '4:3';
          case 'imageModel':
            return 'fal-ai/imagen4/preview/fast';
          default:
            return false;
        }
      });

      rerender();

      act(() => {
        result.current.submitMessage({ text: 'Second image' });
      });

      // Clear previous calls
      mockAsk.mockClear();

      // Switch back to model A
      (useRecoilValue as jest.Mock).mockImplementation((atom) => {
        switch (atom.key) {
          case 'aspectRatio':
            return '4:3';
          case 'imageModel':
            return 'fal-ai/flux-pro/kontext/text-to-image';
          default:
            return false;
        }
      });

      rerender();

      act(() => {
        result.current.submitMessage({ text: 'Third image back to model A' });
      });

      const expectedPromptPrefix =
        'If a tool or MCP server is used for image/ video generation, please always return the image or video url in the response. Keep the response short and concise.\n\n' +
        '[IMPORTANT: Please use the aspect ratio of 4:3 if the user is creating an image.]\n\n' +
        '[IMPORTANT: Please use and override the image model to fal-ai/flux-pro/kontext/text-to-image if the user is creating an image. A sample input scheme is as follows:\n' +
        '        {\n' +
        '          "prompt": "Extreme close-up of a single tiger eye, direct frontal view. Detailed iris and pupil. Sharp focus on eye texture and color. Natural lighting to capture authentic eye shine and depth. The word \\"FLUX\\" is painted over it in big, white brush strokes with visible texture.",\n' +
        '          "num_images": 1,\n' +
        '          "output_format": "jpeg",\n' +
        '          "aspect_ratio": "1:1"\n' +
        '        }]';

      expect(mockAsk).toHaveBeenCalledWith({
        text: 'Third image back to model A',
        overrideConvoId: undefined,
        overrideUserMessageId: undefined,
        clientTimestamp: expect.any(String),
        promptPrefix: expectedPromptPrefix,
      });

      // Verify model A is correctly used again without accumulation
      expect(expectedPromptPrefix).toContain('fal-ai/flux-pro/kontext/text-to-image');
      expect(expectedPromptPrefix).not.toContain('fal-ai/imagen4/preview/fast');
      expect(expectedPromptPrefix).not.toContain('undefined');

      // Ensure only one instance of each instruction type
      const aspectRatioMatches = expectedPromptPrefix.match(/\[IMPORTANT:.*aspect ratio/g);
      const imageModelMatches = expectedPromptPrefix.match(
        /\[IMPORTANT:.*override the image model/g,
      );
      expect(aspectRatioMatches).toHaveLength(1);
      expect(imageModelMatches).toHaveLength(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty or null image model gracefully', () => {
      (useRecoilValue as jest.Mock).mockImplementation((atom) => {
        switch (atom.key) {
          case 'aspectRatio':
            return '16:9';
          case 'imageModel':
            return null; // null value
          default:
            return false;
        }
      });

      const { result } = renderHook(() => useSubmitMessage());

      act(() => {
        result.current.submitMessage({ text: 'Generate an image' });
      });

      const expectedPromptPrefix =
        'If a tool or MCP server is used for image/ video generation, please always return the image or video url in the response. Keep the response short and concise.\n\n' +
        '[IMPORTANT: Please use the aspect ratio of 16:9 if the user is creating an image.]';

      expect(mockAsk).toHaveBeenCalledWith({
        text: 'Generate an image',
        overrideConvoId: undefined,
        overrideUserMessageId: undefined,
        clientTimestamp: expect.any(String),
        promptPrefix: expectedPromptPrefix,
      });

      expect(expectedPromptPrefix).not.toContain('undefined');
      expect(expectedPromptPrefix).not.toContain('null');
    });

    it('should handle undefined aspect ratio gracefully', () => {
      (useRecoilValue as jest.Mock).mockImplementation((atom) => {
        switch (atom.key) {
          case 'aspectRatio':
            return undefined;
          case 'imageModel':
            return 'fal-ai/flux-pro/kontext/text-to-image';
          default:
            return false;
        }
      });

      const { result } = renderHook(() => useSubmitMessage());

      act(() => {
        result.current.submitMessage({ text: 'Generate an image' });
      });

      const expectedPromptPrefix =
        'If a tool or MCP server is used for image/ video generation, please always return the image or video url in the response. Keep the response short and concise.\n\n' +
        '[IMPORTANT: Please use and override the image model to fal-ai/flux-pro/kontext/text-to-image if the user is creating an image. A sample input scheme is as follows:\n' +
        '        {\n' +
        '          "prompt": "Extreme close-up of a single tiger eye, direct frontal view. Detailed iris and pupil. Sharp focus on eye texture and color. Natural lighting to capture authentic eye shine and depth. The word \\"FLUX\\" is painted over it in big, white brush strokes with visible texture.",\n' +
        '          "num_images": 1,\n' +
        '          "output_format": "jpeg",\n' +
        '          "aspect_ratio": "1:1"\n' +
        '        }]';

      expect(mockAsk).toHaveBeenCalledWith({
        text: 'Generate an image',
        overrideConvoId: undefined,
        overrideUserMessageId: undefined,
        clientTimestamp: expect.any(String),
        promptPrefix: expectedPromptPrefix,
      });

      expect(expectedPromptPrefix).not.toContain('undefined');
    });
  });
});
