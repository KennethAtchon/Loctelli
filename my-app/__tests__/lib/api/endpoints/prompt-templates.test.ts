import { PromptTemplatesApi, PromptTemplate, CreatePromptTemplateDto, UpdatePromptTemplateDto } from '@/lib/api/endpoints/prompt-templates'
import { ApiClient } from '@/lib/api/client'

jest.mock('@/lib/logger', () => ({
  default: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

const mockGet = jest.fn();
const mockPost = jest.fn();
const mockPut = jest.fn();
const mockPatch = jest.fn();
const mockDelete = jest.fn();

beforeAll(() => {
  ApiClient.prototype.get = mockGet;
  ApiClient.prototype.post = mockPost;
  ApiClient.prototype.put = mockPut;
  ApiClient.prototype.patch = mockPatch;
  ApiClient.prototype.delete = mockDelete;
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('PromptTemplatesApi', () => {
  let promptTemplatesApi: PromptTemplatesApi

  beforeEach(() => {
    // Create a new instance
    promptTemplatesApi = new PromptTemplatesApi()
  })

  describe('getAll', () => {
    it('should call get all prompt templates endpoint', async () => {
      const mockTemplates: PromptTemplate[] = [
        {
          id: 1,
          name: 'Sales Template',
          description: 'Template for sales conversations',
          isActive: true,
          systemPrompt: 'You are a professional sales representative...',
          role: 'sales',
          instructions: 'Focus on understanding customer needs',
          context: 'B2B sales environment',
          bookingInstruction: 'Schedule a demo if interested',

          temperature: 0.8,
          maxTokens: 1000,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdByAdmin: {
            id: 1,
            name: 'Admin User',
            email: 'admin@example.com',
          },
        },
        {
          id: 2,
          name: 'Support Template',
          description: 'Template for customer support',
          isActive: false,
          systemPrompt: 'You are a helpful customer support agent...',
          role: 'support',
          instructions: 'Be patient and helpful',
          context: 'Customer service environment',
          bookingInstruction: 'Escalate if needed',

          temperature: 0.6,
          maxTokens: 800,
          createdAt: '2024-01-02T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
          createdByAdmin: {
            id: 1,
            name: 'Admin User',
            email: 'admin@example.com',
          },
        },
      ]

      mockGet.mockResolvedValue(mockTemplates)

      const result = await promptTemplatesApi.getAll()

      expect(mockGet).toHaveBeenCalledWith('/admin/prompt-templates')
      expect(result).toEqual(mockTemplates)
    })

    it('should handle get all prompt templates error', async () => {
      const error = new Error('Failed to fetch prompt templates')
      mockGet.mockRejectedValue(error)

      await expect(promptTemplatesApi.getAll()).rejects.toThrow('Failed to fetch prompt templates')
      expect(mockGet).toHaveBeenCalledWith('/admin/prompt-templates')
    })
  })

  describe('getById', () => {
    it('should call get prompt template by id endpoint', async () => {
      const mockTemplate: PromptTemplate = {
        id: 1,
        name: 'Sales Template',
        description: 'Template for sales conversations',
        isActive: true,
        systemPrompt: 'You are a professional sales representative...',
        role: 'sales',
        instructions: 'Focus on understanding customer needs',
        context: 'B2B sales environment',
        bookingInstruction: 'Schedule a demo if interested',

        temperature: 0.8,
        maxTokens: 1000,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        createdByAdmin: {
          id: 1,
          name: 'Admin User',
          email: 'admin@example.com',
        },
      }

      mockGet.mockResolvedValue(mockTemplate)

      const result = await promptTemplatesApi.getById(1)

      expect(mockGet).toHaveBeenCalledWith('/admin/prompt-templates/1')
      expect(result).toEqual(mockTemplate)
    })

    it('should handle get prompt template by id error', async () => {
      const error = new Error('Prompt template not found')
      mockGet.mockRejectedValue(error)

      await expect(promptTemplatesApi.getById(999)).rejects.toThrow('Prompt template not found')
      expect(mockGet).toHaveBeenCalledWith('/admin/prompt-templates/999')
    })
  })

  describe('getActive', () => {
    it('should call get active prompt template endpoint', async () => {
      const mockActiveTemplate: PromptTemplate = {
        id: 1,
        name: 'Sales Template',
        description: 'Template for sales conversations',
        isActive: true,
        systemPrompt: 'You are a professional sales representative...',
        role: 'sales',
        instructions: 'Focus on understanding customer needs',
        context: 'B2B sales environment',
        bookingInstruction: 'Schedule a demo if interested',

        temperature: 0.8,
        maxTokens: 1000,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        createdByAdmin: {
          id: 1,
          name: 'Admin User',
          email: 'admin@example.com',
        },
      }

      mockGet.mockResolvedValue(mockActiveTemplate)

      const result = await promptTemplatesApi.getActive()

      expect(mockGet).toHaveBeenCalledWith('/admin/prompt-templates/active')
      expect(result).toEqual(mockActiveTemplate)
    })

    it('should handle get active prompt template error', async () => {
      const error = new Error('No active prompt template found')
      mockGet.mockRejectedValue(error)

      await expect(promptTemplatesApi.getActive()).rejects.toThrow('No active prompt template found')
      expect(mockGet).toHaveBeenCalledWith('/admin/prompt-templates/active')
    })
  })

  describe('create', () => {
    it('should call create prompt template endpoint with correct data', async () => {
      const createData: CreatePromptTemplateDto = {
        name: 'New Template',
        description: 'A new prompt template',
        isActive: false,
        systemPrompt: 'You are a helpful assistant...',
        role: 'assistant',
        instructions: 'Be helpful and concise',
        context: 'General assistance',
        bookingInstruction: 'Offer to help with scheduling',

        temperature: 0.7,
        maxTokens: 500,
      }

      const mockCreatedTemplate: PromptTemplate = {
        id: 3,
        name: 'New Template',
        description: 'A new prompt template',
        isActive: false,
        systemPrompt: 'You are a helpful assistant...',
        role: 'assistant',
        instructions: 'Be helpful and concise',
        context: 'General assistance',
        bookingInstruction: 'Offer to help with scheduling',

        temperature: 0.7,
        maxTokens: 500,
        createdAt: '2024-01-03T00:00:00Z',
        updatedAt: '2024-01-03T00:00:00Z',
        createdByAdmin: {
          id: 1,
          name: 'Admin User',
          email: 'admin@example.com',
        },
      }

      mockPost.mockResolvedValue(mockCreatedTemplate)

      const result = await promptTemplatesApi.create(createData)

      expect(mockPost).toHaveBeenCalledWith('/admin/prompt-templates', createData)
      expect(result).toEqual(mockCreatedTemplate)
    })

    it('should handle create prompt template error', async () => {
      const createData: CreatePromptTemplateDto = {
        name: 'Invalid Template',
        systemPrompt: '', // Invalid empty prompt
      }

      const error = new Error('System prompt cannot be empty')
      mockPost.mockRejectedValue(error)

      await expect(promptTemplatesApi.create(createData)).rejects.toThrow('System prompt cannot be empty')
      expect(mockPost).toHaveBeenCalledWith('/admin/prompt-templates', createData)
    })

    it('should handle create prompt template with minimal data', async () => {
      const createData: CreatePromptTemplateDto = {
        name: 'Minimal Template',
        systemPrompt: 'You are a helpful assistant.',
      }

      const mockCreatedTemplate: PromptTemplate = {
        id: 4,
        name: 'Minimal Template',
        systemPrompt: 'You are a helpful assistant.',
        isActive: false,
        role: 'assistant',

        temperature: 0.7,
        createdAt: '2024-01-04T00:00:00Z',
        updatedAt: '2024-01-04T00:00:00Z',
        createdByAdmin: {
          id: 1,
          name: 'Admin User',
          email: 'admin@example.com',
        },
      }

      mockPost.mockResolvedValue(mockCreatedTemplate)

      const result = await promptTemplatesApi.create(createData)

      expect(mockPost).toHaveBeenCalledWith('/admin/prompt-templates', createData)
      expect(result).toEqual(mockCreatedTemplate)
    })
  })

  describe('update', () => {
    it('should call update prompt template endpoint with correct data', async () => {
      const updateData: UpdatePromptTemplateDto = {
        name: 'Updated Template',
        description: 'Updated description',
        isActive: true,

      }

      const mockUpdatedTemplate: PromptTemplate = {
        id: 1,
        name: 'Updated Template',
        description: 'Updated description',
        isActive: true,
        systemPrompt: 'You are a professional sales representative...',
        role: 'sales',
        instructions: 'Focus on understanding customer needs',
        context: 'B2B sales environment',
        bookingInstruction: 'Schedule a demo if interested',

        temperature: 0.8,
        maxTokens: 1000,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-03T00:00:00Z',
        createdByAdmin: {
          id: 1,
          name: 'Admin User',
          email: 'admin@example.com',
        },
      }

      mockPatch.mockResolvedValue(mockUpdatedTemplate)

      const result = await promptTemplatesApi.update(1, updateData)

      expect(mockPatch).toHaveBeenCalledWith('/admin/prompt-templates/1', updateData)
      expect(result).toEqual(mockUpdatedTemplate)
    })

    it('should handle update prompt template error', async () => {
      const updateData: UpdatePromptTemplateDto = {
        temperature: 5.0, // Invalid temperature value
      }

      const error = new Error('Temperature must be between 0 and 2')
      mockPatch.mockRejectedValue(error)

      await expect(promptTemplatesApi.update(1, updateData)).rejects.toThrow('Temperature must be between 0 and 2')
      expect(mockPatch).toHaveBeenCalledWith('/admin/prompt-templates/1', updateData)
    })
  })

  describe('activate', () => {
    it('should call activate prompt template endpoint', async () => {
      const mockActivatedTemplate: PromptTemplate = {
        id: 1,
        name: 'Sales Template',
        description: 'Template for sales conversations',
        isActive: true,
        systemPrompt: 'You are a professional sales representative...',
        role: 'sales',
        instructions: 'Focus on understanding customer needs',
        context: 'B2B sales environment',
        bookingInstruction: 'Schedule a demo if interested',

        temperature: 0.8,
        maxTokens: 1000,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-03T00:00:00Z',
        createdByAdmin: {
          id: 1,
          name: 'Admin User',
          email: 'admin@example.com',
        },
      }

      mockPatch.mockResolvedValue(mockActivatedTemplate)

      const result = await promptTemplatesApi.activate(1)

      expect(mockPatch).toHaveBeenCalledWith('/admin/prompt-templates/1/activate')
      expect(result).toEqual(mockActivatedTemplate)
    })

    it('should handle activate prompt template error', async () => {
      const error = new Error('Prompt template not found')
      mockPatch.mockRejectedValue(error)

      await expect(promptTemplatesApi.activate(999)).rejects.toThrow('Prompt template not found')
      expect(mockPatch).toHaveBeenCalledWith('/admin/prompt-templates/999/activate')
    })
  })

  describe('deleteTemplate', () => {
    it('should call delete prompt template endpoint', async () => {
      mockDelete.mockResolvedValue(undefined)

      await promptTemplatesApi.deleteTemplate(1)

      expect(mockDelete).toHaveBeenCalledWith('/admin/prompt-templates/1')
    })

    it('should handle delete prompt template error', async () => {
      const error = new Error('Prompt template not found')
      mockDelete.mockRejectedValue(error)

      await expect(promptTemplatesApi.deleteTemplate(999)).rejects.toThrow('Prompt template not found')
      expect(mockDelete).toHaveBeenCalledWith('/admin/prompt-templates/999')
    })

    it('should handle delete active prompt template error', async () => {
      const error = new Error('Cannot delete active prompt template')
      mockDelete.mockRejectedValue(error)

      await expect(promptTemplatesApi.deleteTemplate(1)).rejects.toThrow('Cannot delete active prompt template')
      expect(mockDelete).toHaveBeenCalledWith('/admin/prompt-templates/1')
    })
  })

  describe('Type Safety', () => {
    it('should enforce correct PromptTemplate structure', () => {
      const validTemplate: PromptTemplate = {
        id: 1,
        name: 'Test Template',
        isActive: true,
        systemPrompt: 'You are a helpful assistant.',
        role: 'assistant',

        temperature: 0.8,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        createdByAdmin: {
          id: 1,
          name: 'Admin User',
          email: 'admin@example.com',
        },
      }

      expect(validTemplate).toHaveProperty('id')
      expect(validTemplate).toHaveProperty('name')
      expect(validTemplate).toHaveProperty('isActive')
      expect(validTemplate).toHaveProperty('systemPrompt')
      expect(validTemplate).toHaveProperty('role')
      expect(validTemplate).toHaveProperty('temperature')
      expect(validTemplate).toHaveProperty('createdAt')
      expect(validTemplate).toHaveProperty('updatedAt')
      expect(validTemplate).toHaveProperty('createdByAdmin')
    })

    it('should enforce correct CreatePromptTemplateDto structure', () => {
      const validCreateDto: CreatePromptTemplateDto = {
        name: 'Test Template',
        systemPrompt: 'You are a helpful assistant.',
      }

      expect(validCreateDto).toHaveProperty('name')
      expect(validCreateDto).toHaveProperty('systemPrompt')
    })

    it('should enforce correct UpdatePromptTemplateDto structure', () => {
      const validUpdateDto: UpdatePromptTemplateDto = {
        name: 'Updated Template',
        isActive: true,
      }

      expect(validUpdateDto).toHaveProperty('name')
      expect(validUpdateDto).toHaveProperty('isActive')
    })

    it('should handle boolean isActive property', () => {
      const activeTemplate: PromptTemplate = {
        id: 1,
        name: 'Active Template',
        isActive: true,
        systemPrompt: 'You are a helpful assistant.',
        role: 'assistant',

        temperature: 0.8,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        createdByAdmin: {
          id: 1,
          name: 'Admin User',
          email: 'admin@example.com',
        },
      }

      const inactiveTemplate: PromptTemplate = {
        id: 2,
        name: 'Inactive Template',
        isActive: false,
        systemPrompt: 'You are a helpful assistant.',
        role: 'assistant',

        temperature: 0.8,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        createdByAdmin: {
          id: 1,
          name: 'Admin User',
          email: 'admin@example.com',
        },
      }

      expect(activeTemplate.isActive).toBe(true)
      expect(inactiveTemplate.isActive).toBe(false)
    })
  })
}) 