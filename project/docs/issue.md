loctelli_api       | [Nest] 1  - 11/09/2025, 2:39:28 AM   DEBUG [AIReceptionistService] Loaded 13 messages into agent memory for leadId=2                                                                                                                                   
loctelli_api       | [2025-11-09T02:39:28.110Z] [AIReceptionist] INFO [TextResource] Generating text for prompt: "what did I say first..."                                                                                                                                  
loctelli_api       | [2025-11-09T02:39:28.110Z] [AIReceptionist] INFO [TextResource] Added user message to conversation: lead-2
loctelli_api       | [2025-11-09T02:39:28.134Z] [AIReceptionist] INFO [Agent] Conversation history passed to AI {                     
loctelli_api       |   agentId: 'agent-1762655898006-pjm44m',                                                                         
loctelli_api       |   conversationId: 'lead-2',                                                                                      
loctelli_api       |   messageCount: 0,                                                                                               
loctelli_api       |   contextMessageCount: 0,                                                                                        
loctelli_api       |   messages: []                                                                                                   
loctelli_api       | }
loctelli_api       | [2025-11-09T02:39:28.134Z] [AIReceptionist] INFO [OpenAIProvider] Chat request for conversation: lead-2          
loctelli_api       | [2025-11-09T02:39:28.134Z] [AIReceptionist] INFO [OpenAIProvider] User message: what did I say first             
loctelli_api       | [2025-11-09T02:39:28.134Z] [AIReceptionist] INFO [OpenAIProvider] Available tools: 13                            
loctelli_api       | [2025-11-09T02:39:30.112Z] [AIReceptionist] INFO [OpenAIProvider] AI response received {                         
loctelli_api       |   conversationId: 'lead-2',
loctelli_api       |   hasToolCalls: false,                                                                                           
loctelli_api       |   toolCallCount: 0,                                                                                              
loctelli_api       |   contentLength: 193,                                                                                            
loctelli_api       |   contentPreview: "I'm sorry, but I can't recall previous messages or conversations. However, I'm here to assist you with any questions or information you may need about...",                                                                         
loctelli_api       |   finishReason: 'stop'
loctelli_api       | }                                                                                                                
loctelli_api       | [2025-11-09T02:39:30.113Z] [AIReceptionist] INFO [TextResource] Added assistant response to conversation: lead-2
loctelli_api       | [2025-11-09T02:39:30.113Z] [AIReceptionist] INFO [TextResource] Text generated successfully { conversationId: 'lead-2', toolsUsed: 0 }                                                                                                                 
loctelli_api       | [Nest] 1  - 11/09/2025, 2:39:30 AM   DEBUG [AIReceptionistService] Generated response for leadId=2: I'm sorry, but I can't recall previous messages or...                                                                                              
loctelli_api       | [ChatService] sendMessage response for leadId=2: {
loctelli_api       |   userMessage: {                                                                                                 
loctelli_api       |     content: 'what did I say first',                                                                             
loctelli_api       |     role: 'user',                                                                                                
loctelli_api       |     timestamp: '2025-11-09T02:39:28.092Z',                                                                       
loctelli_api       |     metadata: { leadId: 2, leadName: 'Sarah Johnson' }                                                           
loctelli_api       |   },                                                                                                             
loctelli_api       |   aiMessage: {                                                                                                   
loctelli_api       |     content: "I'm sorry, but I can't recall previous messages or conversations. However, I'm here to assist you with any questions or information you may need about home remodeling. How can I help you today?",                                      
loctelli_api       |     role: 'assistant',
loctelli_api       |     timestamp: '2025-11-09T02:39:30.121Z',                                                                       
loctelli_api       |     metadata: { generated: true }                                                                                
loctelli_api       |   },                                                                                                             
loctelli_api       |   leadId: 2                                                                                                      
loctelli_api       | }                                                                                                                
loctelli_api       | [Nest] 1  - 11/09/2025, 2:39:30 AM     LOG [ChatController] ✅ Message sent successfully for lead ID: 2 by user: admin@loctelli.com                               

Message History not working properly