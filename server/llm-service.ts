import { storage } from "./storage";

interface ChatRequest {
  message: string;
  conversationId?: number;
  userId: string;
}

interface ChatResponse {
  response: string;
  conversationId: number;
  sources?: string[];
  metadata?: any;
}

// SP Ahilyanagar administrative reform knowledge base
const SYSTEM_CONTEXT = `You are an AI assistant for SP Ahilyanagar's 150-Day Administrative Reform Program for Maharashtra Police. You help with:

1. PROGRAM OVERVIEW:
- 150-day implementation period: May 6, 2025 - October 2, 2025
- Three specialized teams: Alpha (e-Governance), Bravo (GAD Reforms), Charlie (Vision 2047)
- Daily reporting schedule: 8:00, 14:00, 18:00, 22:00 IST
- Budget allocation: ₹74 lakhs across technology, training, and strategic initiatives

2. TEAM RESPONSIBILITIES:
- Alpha Team: Digital transformation, case management systems, online FIR registration, mobile applications
- Bravo Team: Process automation, staff training, performance evaluation systems
- Charlie Team: Strategic planning, technology roadmap, community policing initiatives

3. KEY FEATURES YOU CAN HELP WITH:
- Task management and progress tracking
- Budget allocation and utilization monitoring
- Daily report generation and analysis
- Document management and compliance
- Feedback collection and response
- Timeline planning and milestone tracking

4. ADMINISTRATIVE GUIDELINES:
- Follow Maharashtra Police protocols
- Maintain data security and confidentiality
- Ensure compliance with government regulations
- Support Vision 2047 strategic alignment

Provide practical, actionable guidance specific to police administrative reform and Maharashtra government procedures.`;

export class LLMService {
  private async makePerplexityRequest(messages: any[]): Promise<string> {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      throw new Error('PERPLEXITY_API_KEY not configured');
    }

    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages,
          max_tokens: 500,
          temperature: 0.2,
          top_p: 0.9,
          return_images: false,
          return_related_questions: false,
          search_recency_filter: 'month',
          stream: false,
          presence_penalty: 0,
          frequency_penalty: 1
        })
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'No response generated';
    } catch (error) {
      console.error('Perplexity API error:', error);
      throw new Error('Failed to get AI response');
    }
  }

  private async getContextualData(userId: string): Promise<string> {
    try {
      // Get user context
      const user = await storage.getUser(userId);
      const userTeam = user?.team || 'unknown';
      const userRole = user?.role || 'member';

      // Get recent activities and progress
      const recentActivities = await storage.getActivities(10);
      const dashboardStats = await storage.getDashboardStats();
      const teams = await storage.getTeams();

      // Build context summary
      const context = {
        userInfo: {
          role: userRole,
          team: userTeam,
          permissions: user?.permissions || {}
        },
        programStatus: {
          overallProgress: dashboardStats.overallProgress,
          completedTasks: dashboardStats.tasksCompleted,
          totalTasks: dashboardStats.totalTasks,
          budgetUtilization: `${dashboardStats.budgetUtilized}/${dashboardStats.budgetAllocated}`,
          teamPerformance: dashboardStats.teamPerformance
        },
        recentActivities: recentActivities.slice(0, 5).map(activity => ({
          action: activity.action,
          description: activity.description,
          timestamp: activity.createdAt
        })),
        teams: teams.map(team => ({
          name: team.name,
          focus: team.focusArea
        }))
      };

      return `Current program context: ${JSON.stringify(context, null, 2)}`;
    } catch (error) {
      console.error('Error getting contextual data:', error);
      return 'Context data temporarily unavailable';
    }
  }

  async processChat(request: ChatRequest): Promise<ChatResponse> {
    try {
      let conversationId = request.conversationId;
      let conversationHistory: any[] = [];

      // Get or create conversation
      if (conversationId) {
        conversationHistory = await storage.getChatMessages(conversationId);
      } else {
        const newConversation = await storage.createChatConversation({
          userId: request.userId,
          title: request.message.substring(0, 50) + (request.message.length > 50 ? '...' : ''),
          isActive: true
        });
        conversationId = newConversation.id;
      }

      // Build message history for context
      const messages = [
        { role: 'system', content: SYSTEM_CONTEXT },
        { role: 'system', content: await this.getContextualData(request.userId) }
      ];

      // Add conversation history (last 10 messages for context)
      const recentHistory = conversationHistory.slice(-10);
      for (const msg of recentHistory) {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      }

      // Add current user message
      messages.push({
        role: 'user',
        content: request.message
      });

      // Get AI response
      const aiResponse = await this.makePerplexityRequest(messages);

      // Save user message
      await storage.createChatMessage({
        conversationId,
        role: 'user',
        content: request.message,
        metadata: { timestamp: new Date().toISOString() }
      });

      // Save AI response
      await storage.createChatMessage({
        conversationId,
        role: 'assistant',
        content: aiResponse,
        metadata: { 
          timestamp: new Date().toISOString(),
          model: 'llama-3.1-sonar-small-128k-online'
        }
      });

      // Log AI usage for audit
      await storage.createAuditLog({
        userId: request.userId,
        action: 'ai_chat',
        resource: 'llm_assistant',
        resourceId: conversationId.toString(),
        details: {
          messageLength: request.message.length,
          responseLength: aiResponse.length,
          conversationId
        },
        severity: 'info'
      });

      return {
        response: aiResponse,
        conversationId,
        metadata: {
          model: 'llama-3.1-sonar-small-128k-online',
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Chat processing error:', error);
      
      // Log error for audit
      await storage.createAuditLog({
        userId: request.userId,
        action: 'ai_chat_error',
        resource: 'llm_assistant',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          message: request.message
        },
        severity: 'high'
      });

      throw new Error('Failed to process chat request');
    }
  }

  async getConversationHistory(userId: string, conversationId: number): Promise<any[]> {
    try {
      const messages = await storage.getChatMessages(conversationId);
      
      // Verify user owns this conversation
      const conversations = await storage.getChatConversations(userId);
      const userOwnsConversation = conversations.some(conv => conv.id === conversationId);
      
      if (!userOwnsConversation) {
        throw new Error('Unauthorized access to conversation');
      }

      return messages;
    } catch (error) {
      console.error('Error getting conversation history:', error);
      throw error;
    }
  }

  async getUserConversations(userId: string): Promise<any[]> {
    try {
      return await storage.getChatConversations(userId);
    } catch (error) {
      console.error('Error getting user conversations:', error);
      throw error;
    }
  }

  async deleteConversation(userId: string, conversationId: number): Promise<void> {
    try {
      // Verify user owns this conversation
      const conversations = await storage.getChatConversations(userId);
      const userOwnsConversation = conversations.some(conv => conv.id === conversationId);
      
      if (!userOwnsConversation) {
        throw new Error('Unauthorized access to conversation');
      }

      // Soft delete by marking inactive
      await storage.updateConversationTitle(conversationId, '[Deleted]');
      
      // Note: In a real implementation, you might want to add a soft delete method
      // For now, we'll update the title to indicate deletion
      
      await storage.createAuditLog({
        userId,
        action: 'conversation_deleted',
        resource: 'chat_conversation',
        resourceId: conversationId.toString(),
        severity: 'info'
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }
}

export const llmService = new LLMService();