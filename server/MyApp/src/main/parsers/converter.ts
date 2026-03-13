import * as cheerio from 'cheerio';

type JsonNode = 
  | { type: 'element'; name: string; attributes: Record<string, string>; children: JsonNode[] }
  | { type: 'text'; content: string }
  | { type: 'comment'; content: string }
  | { type: 'cdata'; content: string }
  | { type: 'directive'; name: string; data: string };

const ERROR_MESSAGES = {
  NO_CONTENT: 'Отсутствует контент для обработки',
  INVALID_HTML: 'Некорректная HTML-структура',
  PROCESSING_ERROR: 'Ошибка обработки узла'
};

/**
 * Конвертирует HTML в структурированный JSON
 * @param html Входной HTML-контент
 * @returns Отформатированная JSON-строка
 */
export const convertHtmlToJson = (html: string): string => {
  if (!html.trim()) throw new Error(ERROR_MESSAGES.NO_CONTENT);

  try {
    const $ = cheerio.load(html, { 
      xmlMode: true, 
    });
    
    const rootNodes = $.root().children().toArray() as any[];
    if (rootNodes.length === 0) throw new Error(ERROR_MESSAGES.INVALID_HTML);

    // Находим DOCTYPE
    const doctypeNode = rootNodes.find(node => 
      node.type === 'directive' && node.name?.toLowerCase() === '!doctype'
    );
    
    const result = {
      documentType: doctypeNode 
        ? (doctypeNode.data?.toString().trim() || 'html')
        : 'html',
      nodes: rootNodes
        .filter(node => node.type !== 'directive') // Исключаем директивы
        .map(node => processNode(node))
        .filter(Boolean) as JsonNode[]
    };

    return JSON.stringify(result, null, 2);
  } catch (error) {
    const message = error instanceof Error 
      ? `${ERROR_MESSAGES.PROCESSING_ERROR}: ${error.message}`
      : ERROR_MESSAGES.PROCESSING_ERROR;
    throw new Error(message);
  }
};

/**
 * Рекурсивно обрабатывает HTML-узел
 * @param node Текущий узел для обработки
 * @returns Объект JsonNode или null для игнорируемых узлов
 */
const processNode = (node: any): JsonNode | null => {
  if (!node || typeof node !== 'object') return null;

  switch (node.type) {
    case 'tag': 
    case 'script':
    case 'style': {
      return {
        type: 'element',
        name: node.name || 'unknown',
        attributes: node.attribs || {},
        children: (node.children || [])
          .map((child: any) => processNode(child))
          .filter(Boolean) as JsonNode[]
      };
    }
    
    case 'text': {
      const content = (node.data || '').trim();
      return content ? { type: 'text', content } : null;
    }
    
    case 'comment': {
      const content = (node.data || '').trim();
      return content ? { type: 'comment', content } : null;
    }
    
    case 'cdata': {
      const content = node.children?.[0]?.data?.trim() || '';
      return content ? { type: 'cdata', content } : null;
    }
    
    case 'directive': {
      const name = node.name || '';
      const data = (node.data || '').toString().trim();
      
      if (['!doctype', '?xml'].includes(name)) {
        return { type: 'directive', name, data };
      }
      return null;
    }
    
    // Игнорируем другие типы узлов
    default:
      return null;
  }
};