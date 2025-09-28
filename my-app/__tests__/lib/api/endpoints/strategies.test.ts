import { StrategiesApi } from '@/lib/api/endpoints/strategies'
import { Strategy, CreateStrategyDto } from '@/types'
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

describe('StrategiesApi', () => {
  let strategiesApi: StrategiesApi

  beforeEach(() => {
    // Create a new instance
    strategiesApi = new StrategiesApi()
  })

  describe('getStrategies', () => {
    it('should call get strategies endpoint', async () => {
      const mockStrategies: Strategy[] = [
        {
          id: 1,
          regularUserId: 1,
          name: 'Test Strategy',
          tag: 'test',
          tone: 'professional',
          aiInstructions: 'Test instructions',
          objectionHandling: 'Handle objections',
          qualificationPriority: 'high',

          aiObjective: 'Convert leads',
          disqualificationCriteria: 'Not interested',
          exampleConversation: {},
          delayMin: 5,
          delayMax: 15,
          promptTemplateId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          regularUserId: 1,
          name: 'Another Strategy',
          tag: 'another',
          tone: 'casual',
          aiInstructions: 'Another instructions',
          objectionHandling: 'Another handling',
          qualificationPriority: 'medium',

          aiObjective: 'Another objective',
          disqualificationCriteria: 'Another criteria',
          exampleConversation: {},
          delayMin: 10,
          delayMax: 30,
          promptTemplateId: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      mockGet.mockResolvedValue(mockStrategies)

      const result = await strategiesApi.getStrategies()

      expect(mockGet).toHaveBeenCalledWith('/strategy')
      expect(result).toEqual(mockStrategies)
    })

    it('should handle get strategies error', async () => {
      const error = new Error('Failed to fetch strategies')
      mockGet.mockRejectedValue(error)

      await expect(strategiesApi.getStrategies()).rejects.toThrow('Failed to fetch strategies')
      expect(mockGet).toHaveBeenCalledWith('/strategy')
    })
  })

  describe('getStrategy', () => {
    it('should call get strategy by id endpoint', async () => {
      const mockStrategy: Strategy = {
        id: 1,
        regularUserId: 1,
        name: 'Test Strategy',
        tag: 'test',
        tone: 'professional',
        aiInstructions: 'Test instructions',
        objectionHandling: 'Handle objections',
        qualificationPriority: 'high',

        aiObjective: 'Convert leads',
        disqualificationCriteria: 'Not interested',
        exampleConversation: {},
        delayMin: 5,
        delayMax: 15,
        promptTemplateId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockGet.mockResolvedValue(mockStrategy)

      const result = await strategiesApi.getStrategy(1)

      expect(mockGet).toHaveBeenCalledWith('/strategy/1')
      expect(result).toEqual(mockStrategy)
    })

    it('should handle get strategy error', async () => {
      const error = new Error('Strategy not found')
      mockGet.mockRejectedValue(error)

      await expect(strategiesApi.getStrategy(999)).rejects.toThrow('Strategy not found')
      expect(mockGet).toHaveBeenCalledWith('/strategy/999')
    })
  })

  describe('createStrategy', () => {
    it('should call create strategy endpoint with correct data', async () => {
      const createStrategyData: CreateStrategyDto = {
        regularUserId: 1,
        name: 'New Strategy',
        tag: 'new',
        tone: 'professional',
        aiInstructions: 'New instructions',
        objectionHandling: 'New handling',
        qualificationPriority: 'high',

        aiObjective: 'New objective',
        disqualificationCriteria: 'New criteria',
        exampleConversation: {},
        delayMin: 5,
        delayMax: 15,
        promptTemplateId: 1,
      }

      const mockCreatedStrategy: Strategy = {
        id: 3,
        regularUserId: 1,
        name: 'New Strategy',
        tag: 'new',
        tone: 'professional',
        aiInstructions: 'New instructions',
        objectionHandling: 'New handling',
        qualificationPriority: 'high',

        aiObjective: 'New objective',
        disqualificationCriteria: 'New criteria',
        exampleConversation: {},
        delayMin: 5,
        delayMax: 15,
        promptTemplateId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPost.mockResolvedValue(mockCreatedStrategy)

      const result = await strategiesApi.createStrategy(createStrategyData)

      expect(mockPost).toHaveBeenCalledWith('/strategy', createStrategyData)
      expect(result).toEqual(mockCreatedStrategy)
    })

    it('should handle create strategy error', async () => {
      const createStrategyData: CreateStrategyDto = {
        regularUserId: 1,
        name: 'Invalid Strategy',
        promptTemplateId: 999, // Invalid template ID
      }

      const error = new Error('Invalid prompt template')
      mockPost.mockRejectedValue(error)

      await expect(strategiesApi.createStrategy(createStrategyData)).rejects.toThrow('Invalid prompt template')
      expect(mockPost).toHaveBeenCalledWith('/strategy', createStrategyData)
    })
  })

  describe('updateStrategy', () => {
    it('should call update strategy endpoint with correct data', async () => {
      const updateData = {
        name: 'Updated Strategy',
        tone: 'casual',
      }

      const mockUpdatedStrategy: Strategy = {
        id: 1,
        regularUserId: 1,
        name: 'Updated Strategy',
        tag: 'test',
        tone: 'casual',
        aiInstructions: 'Test instructions',
        objectionHandling: 'Handle objections',
        qualificationPriority: 'high',

        aiObjective: 'Convert leads',
        disqualificationCriteria: 'Not interested',
        exampleConversation: {},
        delayMin: 5,
        delayMax: 15,
        promptTemplateId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPatch.mockResolvedValue(mockUpdatedStrategy)

      const result = await strategiesApi.updateStrategy(1, updateData)

      expect(mockPatch).toHaveBeenCalledWith('/strategy/1', updateData)
      expect(result).toEqual(mockUpdatedStrategy)
    })

    it('should handle update strategy error', async () => {
      const updateData = {
        tone: 'invalid', // Invalid tone value
      }

      const error = new Error('Invalid tone value')
      mockPatch.mockRejectedValue(error)

      await expect(strategiesApi.updateStrategy(1, updateData)).rejects.toThrow('Invalid tone value')
      expect(mockPatch).toHaveBeenCalledWith('/strategy/1', updateData)
    })
  })

  describe('deleteStrategy', () => {
    it('should call delete strategy endpoint', async () => {
      mockDelete.mockResolvedValue(undefined)

      await strategiesApi.deleteStrategy(1)

      expect(mockDelete).toHaveBeenCalledWith('/strategy/1')
    })

    it('should handle delete strategy error', async () => {
      const error = new Error('Strategy not found')
      mockDelete.mockRejectedValue(error)

      await expect(strategiesApi.deleteStrategy(999)).rejects.toThrow('Strategy not found')
      expect(mockDelete).toHaveBeenCalledWith('/strategy/999')
    })
  })

  describe('getStrategiesByUser', () => {
    it('should call get strategies by user endpoint', async () => {
      const mockStrategies: Strategy[] = [
        {
          id: 1,
          regularUserId: 1,
          name: 'User Strategy 1',
          tag: 'user1',
          tone: 'professional',
          aiInstructions: 'User instructions',
          objectionHandling: 'User handling',
          qualificationPriority: 'high',

          aiObjective: 'User objective',
          disqualificationCriteria: 'User criteria',
          exampleConversation: {},
          delayMin: 5,
          delayMax: 15,
          promptTemplateId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      mockGet.mockResolvedValue(mockStrategies)

      const result = await strategiesApi.getStrategiesByUser(1)

      expect(mockGet).toHaveBeenCalledWith('/strategy?regularUserId=1')
      expect(result).toEqual(mockStrategies)
    })

    it('should handle get strategies by user error', async () => {
      const error = new Error('User not found')
      mockGet.mockRejectedValue(error)

      await expect(strategiesApi.getStrategiesByUser(999)).rejects.toThrow('User not found')
      expect(mockGet).toHaveBeenCalledWith('/strategy?regularUserId=999')
    })
  })

  describe('duplicateStrategy', () => {
    it('should call duplicate strategy endpoint', async () => {
      const mockDuplicatedStrategy: Strategy = {
        id: 4,
        regularUserId: 1,
        name: 'Test Strategy (Copy)',
        tag: 'test',
        tone: 'professional',
        aiInstructions: 'Test instructions',
        objectionHandling: 'Handle objections',
        qualificationPriority: 'high',

        aiObjective: 'Convert leads',
        disqualificationCriteria: 'Not interested',
        exampleConversation: {},
        delayMin: 5,
        delayMax: 15,
        promptTemplateId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPost.mockResolvedValue(mockDuplicatedStrategy)

      const result = await strategiesApi.duplicateStrategy(1)

      expect(mockPost).toHaveBeenCalledWith('/strategy/1/duplicate')
      expect(result).toEqual(mockDuplicatedStrategy)
    })

    it('should handle duplicate strategy error', async () => {
      const error = new Error('Strategy not found')
      mockPost.mockRejectedValue(error)

      await expect(strategiesApi.duplicateStrategy(999)).rejects.toThrow('Strategy not found')
      expect(mockPost).toHaveBeenCalledWith('/strategy/999/duplicate')
    })
  })

  describe('Type Safety', () => {
    it('should enforce correct Strategy structure', () => {
      const validStrategy: Strategy = {
        id: 1,
        regularUserId: 1,
        name: 'Test Strategy',
        tag: 'test',
        tone: 'professional',
        aiInstructions: 'Test instructions',
        objectionHandling: 'Handle objections',
        qualificationPriority: 'high',

        aiObjective: 'Convert leads',
        disqualificationCriteria: 'Not interested',
        exampleConversation: {},
        delayMin: 5,
        delayMax: 15,
        promptTemplateId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect(validStrategy).toHaveProperty('id')
      expect(validStrategy).toHaveProperty('regularUserId')
      expect(validStrategy).toHaveProperty('name')
      expect(validStrategy).toHaveProperty('promptTemplateId')
      expect(validStrategy).toHaveProperty('createdAt')
      expect(validStrategy).toHaveProperty('updatedAt')
    })

    it('should enforce correct CreateStrategyDto structure', () => {
      const validCreateStrategyDto: CreateStrategyDto = {
        regularUserId: 1,
        name: 'Test Strategy',
        promptTemplateId: 1,
      }

      expect(validCreateStrategyDto).toHaveProperty('regularUserId')
      expect(validCreateStrategyDto).toHaveProperty('name')
      expect(validCreateStrategyDto).toHaveProperty('promptTemplateId')
    })
  })
}) 