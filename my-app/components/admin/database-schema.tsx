'use client';

import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { api } from '@/lib/api';
import logger from '@/lib/logger';

interface DatabaseSchemaProps {
  className?: string;
}

export default function DatabaseSchema({ className }: DatabaseSchemaProps) {
  const [mermaidCode, setMermaidCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeMermaid();
    generateSchema();
    // generateSchema is stable, but if you ever memoize it, add as dep
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeMermaid = () => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      er: {
        diagramPadding: 20,
        layoutDirection: 'TB',
        minEntityWidth: 100,
        minEntityHeight: 75,
        entityPadding: 15,
        stroke: 'gray',
        fill: 'honeydew',
        fontSize: 12
      }
    });
  };

  const generateSchema = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch schema from backend API
      const response = await api.general.getDatabaseSchema();
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch schema');
      }
      
      // Convert schema to Mermaid ERD
      const erdCode = convertSchemaToMermaid(response.data);
      setMermaidCode(erdCode);
      
      // Render the diagram
      await renderDiagram(erdCode);
    } catch (err) {
      logger.error('Failed to generate database schema:', err);
      setError('Failed to generate database schema');
    } finally {
      setIsLoading(false);
    }
  };

  interface SchemaModelField {
    name: string;
    type: string;
    isRequired: boolean;
    isId: boolean;
    isUnique: boolean;
    isRelation: boolean;
    relationType?: string;
    relationTarget?: string;
  }

  interface SchemaModel {
    name: string;
    fields: SchemaModelField[];
  }

  interface Schema {
    models: SchemaModel[];
  }

  const convertSchemaToMermaid = (schema: Schema) => {
    let mermaid = 'erDiagram\n';
    
    // Add entities
    for (const model of schema.models) {
      mermaid += `    ${model.name} {\n`;
      
      for (const field of model.fields) {
        if (!field.isRelation) {
          const type = getMermaidType(field.type);
          // Only output 'type name' (no PK, unique, nullable, etc.)
          mermaid += `        ${type} ${field.name}\n`;
        }
      }
      
      mermaid += '    }\n';
    }

    // Add relationships (show all, both directions, and deduplicate)
    const rels = new Set();
    for (const model of schema.models) {
      for (const field of model.fields) {
        if (field.isRelation && field.relationTarget) {
          // Compose a unique key to deduplicate (A->B:field)
          const relKey = `${model.name}|${field.relationTarget}|${field.relationType}`;
          if (!rels.has(relKey)) {
            rels.add(relKey);
            const relation = getRelationSymbol(field.relationType || 'many-to-one');
            mermaid += `    ${model.name} ${relation} ${field.relationTarget} : \"${field.name}\"\n`;
          }
        }
      }
    }

    return mermaid;
  };

  const getMermaidType = (prismaType: string): string => {
    const typeMap: Record<string, string> = {
      'Int': 'int',
      'String': 'string',
      'Boolean': 'boolean',
      'DateTime': 'datetime',
      'Json': 'json',
      'Float': 'float',
      'Decimal': 'decimal',
      'BigInt': 'bigint',
      'Bytes': 'bytes'
    };
    
    return typeMap[prismaType] || 'string';
  };

  const getRelationSymbol = (relationType: string): string => {
    switch (relationType) {
      case 'one-to-many':
        return '||--o{';
      case 'many-to-one':
        return '}o--||';
      case 'one-to-one':
        return '||--||';
      default:
        return '}o--o{';
    }
  };

  const renderDiagram = async (code: string): Promise<void> => {
    if (!containerRef.current) return;
    // Clear previous SVG
    containerRef.current.innerHTML = '';
    try {
      // Validate Mermaid code before rendering
      mermaid.parse(code);
      const { svg } = await mermaid.render('database-schema', code);
      containerRef.current.innerHTML = svg;
    } catch (err) {
      logger.error('Failed to render Mermaid diagram:', err);
      setError('Failed to render database diagram: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleRefresh = () => {
    generateSchema();
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleResetZoom = () => {
    setScale(1);
  };

  const handleDownload = () => {
    if (!containerRef.current) return;
    
    const svg = containerRef.current.querySelector('svg');
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = 'database-schema.svg';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Database Schema</CardTitle>
            <CardDescription>
              Entity Relationship Diagram showing database structure and relationships
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetZoom}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={scale >= 2}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4 whitespace-pre-line">{error}</p>
            <Button onClick={handleRefresh}>Retry</Button>
          </div>
        )}
        
        {isLoading && !error && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2">Generating schema...</span>
          </div>
        )}
        
        {!isLoading && !error && (
          <div className="overflow-auto border rounded-lg bg-white">
            <div
              ref={containerRef}
              className="p-4"
              style={{
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                minHeight: '400px'
              }}
            />
          </div>
        )}
        
        {mermaidCode && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
              View Mermaid Code
            </summary>
            <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-64">
              <code>{mermaidCode}</code>
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
} 