import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Avatar,
  CircularProgress,
  IconButton,
  Divider,
  Card,
  CardContent,
} from '@mui/material';
import {
  Send as SendIcon,
  RestartAlt as RestartIcon,
  EnergySavingsLeaf as LeafIcon,
  SmartToy as AIIcon,
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface AIValuationProps {
  onBack: () => void;
  apiKey: string;
}

const AIValuation: React.FC<AIValuationProps> = ({ onBack, apiKey }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'system',
      content: `Welcome to the AI Valuation Assistant for renewable energy projects! 

To get started, please provide details about your project such as:
- Project type (solar, wind, hydro)
- Capacity (MW)
- Capacity factor/yield (%)
- PPA details (price, term)
- Construction cost estimates
- Operating costs
- Location
- Expected COD

Example: "I want to value a 100MW solar project in Arizona with 25% capacity factor, $45/MWh PPA for 20 years, $1.2M/MW construction cost, and $25k/MW/year O&M costs."`,
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  // Scroll to bottom of messages when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (input.trim() === '') return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const systemPrompt = {
        role: "system",
        content: `You are an expert renewable energy valuation assistant specializing in DCF analysis. 
        Follow these guidelines:
        1. Analyze project details and suggest reasonable assumptions for missing data
        2. Present valuation results clearly with markdown formatting
        3. Break down key value drivers and assumptions
        4. Include NPV, IRR, and payback period in the analysis
        5. Format financial metrics in tables
        6. Highlight key risks and sensitivity factors
        7. Use industry standard metrics and benchmarks
        8. Include ESG considerations where relevant`
      };

      const conversationHistory = messages.filter(msg => msg.role !== 'system')
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: "o3-mini",
            messages: [
              systemPrompt,
              ...conversationHistory,
              { role: "user", content: input }
            ],
          })
        });
        
      if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
      }

      const data = await response.json();
      
      const aiMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.choices[0].message.content,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error while generating the valuation. Please check the API key and try again.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'system',
        content: `Welcome to the AI Valuation Assistant for renewable energy projects! 

To get started, please provide details about your project such as:
- Project type (solar, wind, hydro)
- Capacity (MW)
- Capacity factor/yield (%)
- PPA details (price, term)
- Construction cost estimates
- Operating costs
- Location
- Expected COD

Example: "I want to value a 100MW solar project in Arizona with 25% capacity factor, $45/MWh PPA for 20 years, $1.2M/MW construction cost, and $25k/MW/year O&M costs."`,
        timestamp: new Date()
      }
    ]);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, backgroundColor: 'primary.main', color: 'white' }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
          <AIIcon sx={{ mr: 1 }} /> AI Valuation Assistant
        </Typography>
        <Typography variant="body2">
          Describe your renewable energy project for an AI-powered valuation analysis
        </Typography>
      </Box>

      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2, backgroundColor: '#f5f5f5' }}>
        {messages.map((message) => (
          <Box
            key={message.id}
            sx={{
              display: 'flex',
              flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
              mb: 2,
            }}
          >
            <Avatar 
              sx={{ 
                bgcolor: message.role === 'user' ? 'primary.main' : 'secondary.main',
                mr: message.role === 'user' ? 0 : 1,
                ml: message.role === 'user' ? 1 : 0,
              }}
            >
              {message.role === 'user' ? 'U' : <LeafIcon />}
            </Avatar>
            <Paper
              elevation={1}
              sx={{
                p: 2,
                maxWidth: '80%',
                backgroundColor: message.role === 'user' ? '#e3f2fd' : 'white',
                borderRadius: 2,
              }}
            >
              {message.role === 'system' ? (
                <Typography variant="body1" color="text.secondary">
                  {message.content}
                </Typography>
              ) : (
                <Box sx={{ 
                  '& p': { mt: 1, mb: 1 },
                  '& table': { 
                    borderCollapse: 'collapse',
                    width: '100%',
                    mt: 2, 
                    mb: 2
                  },
                  '& th, & td': { 
                    border: '1px solid #ddd',
                    padding: '8px',
                    textAlign: 'left'
                  },
                  '& th': {
                    backgroundColor: '#f2f2f2',
                    fontWeight: 'bold'
                  }
                }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                </Box>
              )}
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'right' }}>
                {message.timestamp.toLocaleTimeString()}
              </Typography>
            </Paper>
          </Box>
        ))}
        <div ref={messagesEndRef} />
        
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress size={40} />
          </Box>
        )}
      </Box>

      <Box sx={{ p: 2, backgroundColor: 'background.paper', borderTop: '1px solid #e0e0e0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TextField
            fullWidth
            multiline
            rows={2}
            placeholder="Describe your renewable energy project (e.g., '100MW solar farm with 85% capacity factor, 20-year PPA at $50/MWh')"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            sx={{ mr: 1 }}
          />
          <Box>
            <IconButton 
              color="primary" 
              onClick={handleSend}
              disabled={isLoading || input.trim() === ''}
            >
              <SendIcon />
            </IconButton>
            <IconButton 
              color="secondary" 
              onClick={handleReset}
              disabled={isLoading || messages.length <= 1}
            >
              <RestartIcon />
            </IconButton>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button variant="outlined" onClick={onBack}>
            Back to DCF Calculator
          </Button>
          <Typography variant="caption" color="text.secondary">
            Powered by OpenAI o3-mini
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default AIValuation;