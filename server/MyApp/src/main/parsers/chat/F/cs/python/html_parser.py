from typing import Dict, Any, Optional, List, Tuple
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
from datetime import datetime
from io import StringIO
import argparse
import requests
import logging
import json
import html
import time
import csv
import sys
import re
import os

# Попытка импорта дополнительных библиотек для автоматизации
try:
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler
    WATCHDOG_AVAILABLE = True
except ImportError:
    WATCHDOG_AVAILABLE = False
    print("Watchdog не установлен. Режим мониторинга папки недоступен.")

try:
    from flask import Flask, request, jsonify
    FLASK_AVAILABLE = True
except ImportError:
    FLASK_AVAILABLE = False
    print("Flask не установлен. Режим API недоступен.")

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('parser_auto.log', encoding='utf-8')
    ]
)

class AutoParser:
    """Класс для автоматической работы парсера"""
    
    def __init__(self):
        self.is_running = False
        self.observer = None
        
    def show_progress_bar(self, current: int, total: int, current_item: str = "", bar_length: int = 50) -> None:
        progress = current / total
        arrow = '=' * int(round(progress * bar_length) - 1) + '>'
        spaces = ' ' * (bar_length - len(arrow))
        
        sys.stdout.write(f'\r[{arrow + spaces}] {int(progress * 100)}% ({current}/{total})')
        if current_item:
            display_item = current_item[:40] + "..." if len(current_item) > 40 else current_item
            sys.stdout.write(f' {display_item}')
        sys.stdout.flush()

    def process_multiple_urls(self, urls: List[str], output_dir: str = "output") -> List[Tuple[str, str, bool]]:
        results = []
        total = len(urls)
        
        print(f"Processing {total} URLs...")
        os.makedirs(output_dir, exist_ok=True)
        
        for i, url in enumerate(urls, 1):
            self.show_progress_bar(i, total, url)
            
            try:
                result = self.parse_html_direct(url)
                safe_filename = re.sub(r'[^\w\-_.]', '_', url)
                if len(safe_filename) > 100:
                    safe_filename = safe_filename[:100]
                
                output_path = os.path.join(output_dir, f"{safe_filename}.html")
                self.save_html_to_file(result, output_path)
                
                results.append((url, output_path, True))
                
            except Exception as e:
                error_msg = f"Error processing {url}: {str(e)}"
                logging.error(error_msg)
                results.append((url, error_msg, False))
        
        sys.stdout.write('\n')
        sys.stdout.flush()
        
        return results

    def print_summary(self, results: List[Tuple[str, str, bool]]) -> None:
        successful = [r for r in results if r[2]]
        failed = [r for r in results if not r[2]]
        
        print(f"\n✓ Processing completed!")
        print(f"Successful: {len(successful)}")
        print(f"Failed: {len(failed)}")
        print(f"Total: {len(results)}")
        
        if successful:
            print(f"\nSuccessful URLs:")
            for url, output_path, _ in successful[:10]:
                print(f"  - {url} -> {output_path}")
            if len(successful) > 10:
                print(f"  ... and {len(successful) - 10} more")
        
        if failed:
            print(f"\nFailed URLs:")
            for url, error_msg, _ in failed[:5]:
                print(f"  - {url}: {error_msg}")
            if len(failed) > 5:
                print(f"  ... and {len(failed) - 5} more")

    def save_html_to_file(self, html_content: str, filename: str) -> bool:
        try:
            directory = os.path.dirname(filename)
            if directory and not os.path.exists(directory):
                os.makedirs(directory)
                logging.info(f"Created directory: {directory}")
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(html_content)
            logging.info(f"Successfully saved HTML to {filename}")
            return True
        except Exception as e:
            logging.error(f"Failed to save HTML to {filename}: {str(e)}")
            return False

    def parse_html_direct(self, content_input):
        try:
            content = ''
            input_type_name = str(type(content_input)) if content_input is not None else 'None'
            logging.info("Direct input type: %s", input_type_name)
            
            if content_input is None:
                error_html = self.create_error_html('Empty input')
                self.save_html_to_file(error_html, "error_output.html")
                return error_html
            
            try:
                if hasattr(content_input, 'decode'):
                    content = content_input.decode('utf-8', errors='replace')
                    logging.info("Successfully decoded bytes to str (len: %d)", len(content))
                else:
                    content = str(content_input)
                    logging.info("Successfully str() converted input (len: %d)", len(content))
            except Exception as decode_err:
                logging.warning("Decode/str failed: %s, falling back to repr", decode_err)
                content = repr(content_input)
            
            if not content or len(content.strip()) == 0:
                error_html = self.create_error_html('Content is empty after coercion')
                self.save_html_to_file(error_html, "error_output.html")
                return error_html
            
            logging.info("Final content type: %s (len: %d)", type(content).__name__, len(content))
            if content.strip().startswith(('http://', 'https://')):
                logging.info("Detected URL, fetching content")
                fetched = self.fetch_url_content(content.strip())
                if not fetched:
                    error_html = self.create_error_html('Failed to fetch URL content')
                    self.save_html_to_file(error_html, "error_output.html")
                    return error_html
                content = fetched
                logging.info("Fetched HTML len: %d", len(content))
            
            if self.is_html_content(content):
                logging.info("Detected raw HTML, returning as-is")
                self.save_html_to_file(content, "original_output.html")
                return content
            
            logging.info("Parsing content as HTML")
            result = self.parse_advanced_html(content, {'return_raw_html': False})
            html_result = self.convert_to_html(result)
            self.save_html_to_file(html_result, "parsed_output.html")
            
            return html_result
            
        except Exception as e:
            error_msg = f'Direct parse error: {str(e)}'
            logging.error(error_msg)
            error_html = self.create_error_html(error_msg)
            self.save_html_to_file(error_html, "error_output.html")
            return error_html

    def convert_to_html(self, result):
        if not result.get('success', False):
            return self.create_error_html(result.get('error', 'Unknown error'))
        
        data = result.get('data', {})
        analysis = result.get('analysis', {})
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='utf-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1'>
            <title>Parsing Result</title>
            <style>
                body {{
                    font-family: sans-serif;
                    margin: 1em;
                    padding: 0;
                    background: #f9f9f9;
                }}
                .card {{
                    background: #fff;
                    padding: 1em;
                    margin: 1em 0;
                    border-radius: 8px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                    border-left: 4px solid #4CAF50;
                }}
                .section {{
                    margin: 2em 0;
                }}
                .section-title {{
                    color: #333;
                    border-bottom: 2px solid #4CAF50;
                    padding-bottom: 0.5em;
                }}
                .item {{
                    padding: 0.5em;
                    margin: 0.5em 0;
                    background: #f8f9fa;
                    border-radius: 4px;
                }}
                .success {{
                    color: #4CAF50;
                    font-weight: bold;
                }}
                table {{
                    width: 100%;
                    border-collapse: collapse;
                    margin: 1em 0;
                }}
                th, td {{
                    border: 1px solid #ddd;
                    padding: 0.5em;
                    text-align: left;
                }}
                th {{
                    background: #f2f2f2;
                }}
            </style>
        </head>
        <body>
            <div class='card'>
                <h1 class='success'>Parsing Successful</h1>
            </div>
        """
        
        if analysis:
            html_content += """
            <div class='card'>
                <h2 class='section-title'>Analysis</h2>
                <div class='item'>
            """
            for key, value in analysis.items():
                html_content += f"<p><strong>{key}:</strong> {html.escape(str(value))}</p>"
            html_content += """
                </div>
            </div>
            """
        
        if data:
            html_content += """
            <div class='card'>
                <h2 class='section-title'>Data</h2>
            """
            
            if data.get('title'):
                html_content += f"""
                <div class='item'>
                    <h3>Title</h3>
                    <p>{html.escape(str(data['title']))}</p>
                </div>
                """
            
            if data.get('meta_description'):
                html_content += f"""
                <div class='item'>
                    <h3>Meta Description</h3>
                    <p>{html.escape(str(data['meta_description']))}</p>
                </div>
                """
            
            if data.get('headings'):
                html_content += """
                <div class='item'>
                    <h3>Headings</h3>
                """
                for heading in data['headings']:
                    html_content += f"<p>H{heading['level']}: {html.escape(heading['text'])}</p>"
                html_content += "</div>"
            
            if data.get('links'):
                html_content += """
                <div class='item'>
                    <h3>Links</h3>
                """
                for link in data['links'][:10]:
                    html_content += f"<p><a href='{html.escape(link['href'])}' target='_blank'>{html.escape(link['text'] or link['href'])}</a></p>"
                html_content += "</div>"
            
            if data.get('images'):
                html_content += """
                <div class='item'>
                    <h3>Images</h3>
                """
                for img in data['images'][:5]:
                    html_content += f"<p><img src='{html.escape(img['src'])}' alt='{html.escape(img['alt'] or '')}' style='max-width: 200px;'><br>{html.escape(img['src'])}</p>"
                html_content += "</div>"
            
            if data.get('paragraphs'):
                html_content += """
                <div class='item'>
                    <h3>Paragraphs</h3>
                """
                for para in data['paragraphs'][:5]:
                    html_content += f"<p>{html.escape(para)}</p><hr>"
                html_content += "</div>"
            
            if data.get('tables'):
                html_content += """
                <div class='item'>
                    <h3>Tables</h3>
                """
                for table in data['tables']:
                    html_content += "<table>"
                    for row in table['data']:
                        html_content += "<tr>"
                        for cell in row:
                            html_content += f"<td>{html.escape(str(cell))}</td>"
                        html_content += "</tr>"
                    html_content += "</table><br>"
                html_content += "</div>"
            
            html_content += "</div>"
        
        html_content += """
        </body>
        </html>
        """
        
        return html_content

    def parse_input_data(self, input_json):
        try:
            input_type_name = str(type(input_json)) if input_json is not None else 'None'
            logging.info("JSON input type: %s", input_type_name)
            
            if input_json is None:
                raise ValueError('Empty JSON input')
            
            try:
                input_json_str = str(input_json)
                logging.info("str() converted JSON input (len: %d)", len(input_json_str))
            except Exception as str_err:
                logging.warning("str() failed: %s, falling back to repr", str_err)
                input_json_str = repr(input_json)
            
            if hasattr(input_json_str, 'decode'):
                input_json_str = input_json_str.decode('utf-8', errors='replace')
            
            logging.info("Final JSON input type: %s (len: %d, preview: %s)", type(input_json_str).__name__, len(input_json_str), input_json_str[:100])
            input_data = json.loads(input_json_str)
            parser_type = input_data.get('type', 'html')
            content_raw = input_data.get('content', '')
            content_type_name = str(type(content_raw)) if content_raw is not None else 'None'
            logging.info("Raw content type: %s", content_type_name)
            
            try:
                content_str = str(content_raw)
                logging.info("str() converted content (len: %d)", len(content_str))
            except Exception as content_str_err:
                logging.warning("str() for content failed: %s, falling back", content_str_err)
                content_str = repr(content_raw) if content_raw is not None else ''
            
            if hasattr(content_str, 'decode'):
                content = content_str.decode('utf-8', errors='replace')
            else:
                content = content_str
            
            logging.info("Final content type: %s (len: %d)", type(content).__name__, len(content))
            options = input_data.get('options', {})
            
            if options.get('return_raw_html', True):
                if content and self.is_html_content(content):
                    return content
                
                if options.get('input_type') == 'url':
                    html_content = self.fetch_url_content(content)
                    if html_content:
                        return html_content
                    else:
                        return self.create_error_html('Failed to fetch URL content')
            
            if options.get('input_type') == 'url':
                fetched = self.fetch_url_content(content)
                if not fetched:
                    return self.create_error_html('Failed to fetch URL content')
                content = fetched
            
            content_type = self.detect_content_type(content, options)
            logging.info("Detected content type: %s", content_type)
            
            if parser_type == 'html':
                selector = options.get('selector', 'body')
                result = self.parse_html(content, selector, options)
            elif parser_type == 'advanced_html':
                result = self.parse_advanced_html(content, options)
            elif parser_type == 'csv_advanced':
                result = self.parse_csv_advanced(content, options)
            elif parser_type == 'json':
                result = self.parse_json(content)
            elif parser_type == 'xml':
                result = self.parse_xml(content)
            elif parser_type == 'text':
                result = self.parse_text(content)
            else:
                result = {'success': False, 'error': f'Unknown parser type: {parser_type}'}
            
            if result.get('success'):
                self.save_result(result, content_type, options.get('input_path', 'input'))
            
            return result
            
        except json.JSONDecodeError as e:
            error_msg = f'Invalid JSON input: {str(e)}'
            logging.error(error_msg)
            return {'success': False, 'error': error_msg}
        except Exception as e:
            error_msg = f'Main execution error: {str(e)}'
            logging.error(error_msg)
            import traceback
            logging.error("Traceback: %s", traceback.format_exc())
            return {'success': False, 'error': error_msg}

    def create_error_html(self, error_message):
        """Создает HTML с сообщением об ошибке"""
        return f"""<!DOCTYPE html>
    <html>
    <head>
        <meta charset='utf-8'>
        <meta name='viewport' content='width=device-width, initial-scale=1'>
        <style>
            body{{
                font-family: sans-serif;
                margin: 1em;
                padding: 0;
                background: #f9f9f9;
            }}
            .card{{
                background: #fff;
                padding: 1em;
                margin: 1em 0;
                border-radius: 8px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                border-left: 4px solid #ff4444;
            }}
            .error {{
                color: #d32f2f;
                font-weight: bold;
            }}
        </style>
    </head>
    <body>
        <div class='card'>
            <h2>Error</h2>
            <p class='error'>{html.escape(str(error_message))}</p>
        </div>
    </body>
    </html>"""

    def is_html_content(self, content):
        if not content:
            return False
        try:
            clean_content = str(content).strip()
            return (clean_content.startswith('<!DOCTYPE html>') or 
                    clean_content.startswith('<html>') or
                    (clean_content.startswith('<') and '</html>' in clean_content) or
                    '<body' in clean_content.lower() or
                    '<div' in clean_content.lower() or
                    '<p' in clean_content.lower())
        except:
            return False

    def fetch_url_content(self, url: str) -> Optional[str]:
        try:
            if not url:
                return None
                
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            response = requests.get(url, headers=headers, timeout=15)
            response.raise_for_status()
            return response.text
        except Exception as e:
            logging.error("Ошибка загрузки URL %s: %s", url, e)
            return None

    def detect_content_type(self, content: str, options: Dict[str, Any]) -> str:
        if not content:
            return 'text'
            
        content_type = options.get('content_type', '')
        input_path = options.get('input_path', '')
        
        if content_type:
            if 'application/json' in content_type:
                return 'json'
            if 'application/xml' in content_type or 'text/xml' in content_type:
                return 'xml'
            if 'text/csv' in content_type:
                return 'csv'
            if 'text/plain' in content_type:
                return 'text'
            if 'text/html' in content_type:
                return 'html'
        
        if input_path:
            ext = os.path.splitext(input_path)[1].lower()
            if ext == '.json':
                return 'json'
            if ext == '.xml':
                return 'xml'
            if ext == '.csv':
                return 'csv'
            if ext == '.txt':
                return 'text'
            if ext in ['.html', '.htm']:
                return 'html'
        
        clean_content = content.strip()
        if clean_content:
            if clean_content.startswith(('{', '[')) and clean_content.endswith(('}', ']')):
                try:
                    json.loads(clean_content)
                    return 'json'
                except:
                    pass
            if clean_content.startswith('<?xml') or clean_content.startswith('<'):
                if '<?xml' in clean_content or ('<root>' in clean_content and '</root>' in clean_content):
                    return 'xml'
                elif '<html' in clean_content.lower() or '<body' in clean_content.lower():
                    return 'html'
            if ',' in clean_content and '\n' in clean_content:
                lines = clean_content.split('\n')
                if len(lines) > 1 and all(',' in line for line in lines[:3]):
                    return 'csv'
        
        return 'text'

    def parse_json(self, content: str) -> Dict[str, Any]:
        try:
            if not content or not content.strip():
                return {'success': False, 'error': 'Empty JSON content', 'data': {}}
            data = json.loads(content)
            return {
                'success': True,
                'data': data,
                'analysis': {
                    'item_count': len(data) if isinstance(data, (list, dict)) else 1,
                    'type': 'array' if isinstance(data, list) else 'object'
                }
            }
        except Exception as e:
            return {'success': False, 'error': str(e), 'data': {}}

    def parse_xml(self, content: str) -> Dict[str, Any]:
        try:
            if not content or not content.strip():
                return {'success': False, 'error': 'Empty XML content', 'data': {}}
            
            def xml_to_dict(node):
                result = {}
                for attr in node.attrib:
                    result[attr] = node.get(attr)
                for child in node:
                    child_data = xml_to_dict(child)
                    if child.tag in result:
                        if isinstance(result[child.tag], list):
                            result[child.tag].append(child_data)
                        else:
                            result[child.tag] = [result[child.tag], child_data]
                    else:
                        result[child.tag] = child_data
                if node.text and node.text.strip() and len(node) == 0:
                    return node.text.strip()
                return result
            
            root = ET.fromstring(content)
            data = xml_to_dict(root)
            return {
                'success': True,
                'data': data,
                'analysis': {
                    'root_tag': root.tag,
                    'element_count': len(root.findall('.//*'))
                }
            }
        except Exception as e:
            return {'success': False, 'error': str(e), 'data': {}}

    def parse_text(self, content: str) -> Dict[str, Any]:
        try:
            if not content or not content.strip():
                return {'success': False, 'error': 'Empty text content', 'data': {}}
            
            words = content.split()
            sentences = re.split(r'[.!?]+', content)
            sentences = [s.strip() for s in sentences if s.strip()]
            
            return {
                'success': True,
                'data': {'content': content},
                'analysis': {
                    'word_count': len(words),
                    'sentence_count': len(sentences),
                    'character_count': len(content),
                    'avg_sentence_length': len(words) / len(sentences) if sentences else 0
                }
            }
        except Exception as e:
            return {'success': False, 'error': str(e), 'data': {}}

    def parse_html(self, content: str, selector: str, options: Dict[str, Any]) -> Dict[str, Any]:
        try:
            if not content or not content.strip():
                return {'success': False, 'error': 'Empty HTML content', 'data': []}
                
            soup = BeautifulSoup(content, 'html.parser')
            elements = soup.select(selector)
            
            results = []
            for element in elements:
                result = {
                    'text': element.get_text(strip=True)
                }
                
                if options.get('returnHtml'):
                    result['html'] = str(element)
                    
                if options.get('includeAttributes'):
                    result['attributes'] = dict(element.attrs)
                    
                if options.get('attribute'):
                    attr_value = element.get(options['attribute'])
                    if attr_value:
                        result['text'] = attr_value.strip()
                        
                results.append(result)
                
            return {
                'success': True,
                'data': results,
                'analysis': {
                    'element_count': len(results),
                    'selector': selector
                }
            }
        except Exception as e:
            return {'success': False, 'error': str(e), 'data': []}

    def parse_advanced_html(self, content: str, options: Dict[str, Any]) -> Dict[str, Any]:
        try:
            if not content or not content.strip():
                return {'success': False, 'error': 'Empty HTML content', 'data': {}}
            
            parser = options.get('parser', 'html.parser')
            tags_to_remove = options.get('remove_tags', ['script', 'style', 'nav', 'footer'])
            max_paragraphs = options.get('max_paragraphs', 10)
            max_tables = options.get('max_tables', 5)
            include_analysis = options.get('include_analysis', True)
            
            soup = BeautifulSoup(content, parser)
            
            for tag in soup(tags_to_remove):
                tag.decompose()
            
            results = {
                'title': soup.title.string.strip() if soup.title else None,
                'meta_description': None,
                'headings': [],
                'links': [],
                'images': [],
                'paragraphs': [],
                'tables': []
            }
            
            meta_desc = soup.find('meta', attrs={'name': re.compile('description', re.I)})
            if meta_desc and meta_desc.get('content'):
                results['meta_description'] = meta_desc.get('content').strip()
            
            for i in range(1, 7):
                headings = soup.find_all(f'h{i}')
                for h in headings:
                    text = h.get_text(strip=True)
                    if text:
                        results['headings'].append({
                            'level': i,
                            'text': text
                        })
            
            for link in soup.find_all('a', href=True):
                href = link['href'].strip()
                if href:
                    results['links'].append({
                        'text': link.get_text(strip=True),
                        'href': href,
                        'title': link.get('title', '').strip() or None
                    })
            
            for img in soup.find_all('img', src=True):
                src = img['src'].strip()
                if src:
                    results['images'].append({
                        'src': src,
                        'alt': img.get('alt', '').strip() or None,
                        'title': img.get('title', '').strip() or None
                    })
            
            paragraphs = soup.find_all('p')
            for p in paragraphs[:max_paragraphs]:
                text = p.get_text(strip=True)
                if text and len(text) > 10:
                    results['paragraphs'].append(text)
            
            tables = soup.find_all('table')
            for i, table in enumerate(tables[:max_tables]):
                table_data = []
                rows = table.find_all('tr')
                for row in rows:
                    cols = row.find_all(['td', 'th'])
                    row_data = [col.get_text(strip=True) for col in cols]
                    if row_data:
                        table_data.append(row_data)
                if table_data:
                    results['tables'].append({
                        'index': i,
                        'data': table_data
                    })
            
            return_dict = {
                'success': True,
                'data': results
            }
            
            if include_analysis:
                return_dict['analysis'] = {
                    'heading_count': len(results['headings']),
                    'link_count': len(results['links']),
                    'image_count': len(results['images']),
                    'paragraph_count': len(results['paragraphs']),
                    'table_count': len(results['tables'])
                }
            
            return return_dict
            
        except Exception as e:
            return {'success': False, 'error': str(e), 'data': {}}

    def parse_csv_advanced(self, content: str, options: Dict[str, Any]) -> Dict[str, Any]:
        try:
            if not content or not content.strip():
                return {'success': True, 'data': [], 'analysis': {'row_count': 0, 'column_count': 0}}
                
            f = StringIO(content)
            delimiter = options.get('delimiter', ',')
            has_header = options.get('hasHeader', True)
            
            reader = csv.reader(f, delimiter=delimiter)
            rows = list(reader)
            
            if not rows:
                return {'success': True, 'data': [], 'analysis': {'row_count': 0, 'column_count': 0}}
                
            analysis = {
                'row_count': len(rows),
                'column_count': len(rows[0]) if rows else 0,
                'has_header': has_header,
                'delimiter': delimiter
            }
            
            if has_header and rows:
                analysis['headers'] = rows[0]
                data_rows = rows[1:]
            else:
                analysis['headers'] = [f'Column_{i+1}' for i in range(len(rows[0]))]
                data_rows = rows
                
            data = []
            for row in data_rows:
                if len(row) == len(analysis['headers']):
                    data.append(dict(zip(analysis['headers'], [cell.strip() for cell in row])))
                    
            return {
                'success': True,
                'data': data,
                'analysis': analysis
            }
        except Exception as e:
            return {'success': False, 'error': str(e), 'data': []}
        
    def save_result(self, result: Dict[str, Any], content_type: str, input_path: str = 'input'):
        if not result.get('success', False):
            logging.error("Cannot save result: parsing failed - %s", result.get('error', 'Unknown error'))
            return
        
        base_name = os.path.splitext(os.path.basename(input_path))[0]
        out_file = f"{base_name}_output.{content_type.lower()}"
        
        try:
            with open(out_file, 'w', encoding='utf-8') as f:
                if content_type == 'json':
                    f.write(json.dumps(result['data'], indent=4, ensure_ascii=False))
                elif content_type == 'xml':
                    def dict_to_xml(data, indent=0):
                        xml = []
                        indent_str = '  ' * indent
                        if isinstance(data, dict):
                            for key, value in data.items():
                                xml.append(f"{indent_str}<{key}>")
                                if isinstance(value, str):
                                    escaped = html.escape(value)
                                    xml.append(escaped)
                                elif isinstance(value, (dict, list)):
                                    xml.append('\n')
                                    xml.append(dict_to_xml(value, indent + 1))
                                    xml.append(indent_str)
                                else:
                                    xml.append(str(value))
                                xml.append(f"</{key}>\n")
                        elif isinstance(data, list):
                            for item in data:
                                xml.append(f"{indent_str}<item>")
                                if isinstance(item, str):
                                    escaped = html.escape(item)
                                    xml.append(escaped)
                                elif isinstance(item, (dict, list)):
                                    xml.append('\n')
                                    xml.append(dict_to_xml(item, indent + 1))
                                    xml.append(indent_str)
                                else:
                                    xml.append(str(item))
                                xml.append(f"</item>\n")
                        return ''.join(xml)
                    f.write('<?xml version="1.0" encoding="UTF-8"?>\n<root>\n')
                    f.write(dict_to_xml(result['data'], 1))
                    f.write('</root>\n')
                elif content_type == 'csv':
                    if isinstance(result['data'], list) and result['data']:
                        writer = csv.DictWriter(f, fieldnames=result['data'][0].keys())
                        writer.writeheader()
                        writer.writerows(result['data'])
                    elif isinstance(result['data'], dict):
                        for key, value in result['data'].items():
                            f.write(f"{key},{value}\n")
                else:
                    f.write(json.dumps(result['data'], indent=4, ensure_ascii=False))
            logging.info("Successfully saved to %s", out_file)
        except Exception as e:
            logging.error("Error saving to %s: %s", out_file, e)

    # === АВТОМАТИЗАЦИЯ ===

    def start_folder_monitoring(self, watch_folder: str = "watch_folder"):
        """Запускает мониторинг папки для автоматической обработки файлов"""
        if not WATCHDOG_AVAILABLE:
            print("Watchdog не установлен. Установите: pip install watchdog")
            return
        
        if not os.path.exists(watch_folder):
            os.makedirs(watch_folder)
            print(f"Создана папка для мониторинга: {watch_folder}")
        
        class ParserHandler(FileSystemEventHandler):
            def __init__(self, parser_instance):
                self.parser = parser_instance
                
            def on_created(self, event):
                if not event.is_directory:
                    self.process_file(event.src_path)
            
            def on_modified(self, event):
                if not event.is_directory:
                    # Небольшая задержка чтобы файл успел полностью записаться
                    time.sleep(0.5)
                    self.process_file(event.src_path)
            
            def process_file(self, file_path):
                try:
                    print(f"Обнаружен новый файл: {file_path}")
                    
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    result = self.parser.parse_html_direct(content)
                    
                    # Сохраняем результат
                    output_dir = os.path.join(os.path.dirname(file_path), "parsed_results")
                    os.makedirs(output_dir, exist_ok=True)
                    
                    base_name = os.path.splitext(os.path.basename(file_path))[0]
                    output_path = os.path.join(output_dir, f"{base_name}_parsed.html")
                    
                    with open(output_path, 'w', encoding='utf-8') as f:
                        f.write(result if isinstance(result, str) else str(result))
                    
                    print(f"Файл обработан: {output_path}")
                    
                except Exception as e:
                    print(f"Ошибка обработки {file_path}: {e}")
        
        event_handler = ParserHandler(self)
        self.observer = Observer()
        self.observer.schedule(event_handler, watch_folder, recursive=True)
        self.observer.start()
        
        self.is_running = True
        print(f"Мониторинг папки '{watch_folder}' запущен...")
        print("Добавляйте файлы для автоматической обработки")
        print("Нажмите Ctrl+C для остановки")
        
        try:
            while self.is_running:
                time.sleep(1)
        except KeyboardInterrupt:
            self.stop_folder_monitoring()

    def stop_folder_monitoring(self):
        """Останавливает мониторинг папки"""
        if self.observer:
            self.observer.stop()
            self.observer.join()
            self.is_running = False
            print("Мониторинг папки остановлен")

    def start_api_server(self, host: str = '0.0.0.0', port: int = 5000):
        """Запускает REST API сервер"""
        if not FLASK_AVAILABLE:
            print("Flask не установлен. Установите: pip install flask")
            return
        
        app = Flask(__name__)

        @app.route('/parse', methods=['POST'])
        def parse_endpoint():
            """REST endpoint для парсинга"""
            data = request.get_json()
            
            if not data:
                return jsonify({'error': 'No data provided'}), 400
            
            try:
                content = data.get('content', '')
                content_type = data.get('type', 'auto')
                
                if data.get('url'):
                    # Если передан URL
                    result = self.parse_html_direct(data['url'])
                    return jsonify({
                        'success': True,
                        'result': 'HTML результат сохранен в файл'
                    })
                else:
                    # Если передан контент
                    input_data = {
                        'type': content_type,
                        'content': content,
                        'options': data.get('options', {})
                    }
                    result = self.parse_input_data(json.dumps(input_data))
                    return jsonify(result)
            
            except Exception as e:
                return jsonify({'error': str(e)}), 500

        @app.route('/health', methods=['GET'])
        def health_check():
            return jsonify({'status': 'running', 'timestamp': datetime.now().isoformat()})

        @app.route('/parse/url', methods=['POST'])
        def parse_url_endpoint():
            """Endpoint для парсинга URL"""
            data = request.get_json()
            
            if not data or 'url' not in data:
                return jsonify({'error': 'URL is required'}), 400
            
            try:
                result = self.parse_html_direct(data['url'])
                return jsonify({
                    'success': True,
                    'message': 'URL успешно обработан',
                    'result_length': len(result) if isinstance(result, str) else 0
                })
            except Exception as e:
                return jsonify({'error': str(e)}), 500

        print(f"Запуск API сервера на {host}:{port}")
        print("Доступные endpoints:")
        print("  POST /parse - парсинг контента")
        print("  POST /parse/url - парсинг URL")
        print("  GET /health - проверка здоровья сервера")
        
        app.run(host=host, port=port, debug=False)

    def run_once(self, urls: List[str], output_dir: str = "auto_output"):
        """Выполняет разовый парсинг указанных URL"""
        print(f"Запуск разового парсинга {len(urls)} URL...")
        results = self.process_multiple_urls(urls, output_dir)
        self.print_summary(results)
        return results

def main():
    parser = AutoParser()
    
    # Если есть аргументы командной строки и первый аргумент не начинается с '--', то используем старую логику
    if len(sys.argv) > 1 and not sys.argv[1].startswith('--'):
        # Старая логика для обратной совместимости
        if len(sys.argv) > 2:
            urls = sys.argv[1:]
            logging.info("Multiple URLs mode: Processing %d URLs", len(urls))
            results = parser.process_multiple_urls(urls)
            parser.print_summary(results)
            return
        elif len(sys.argv) > 1:
            url_or_content = sys.argv[1]
            logging.info("CLI mode: Using direct parse for arg '%s'", url_or_content)
            result = parser.parse_html_direct(url_or_content)
            print(result)
            return
        else:
            input_data = sys.stdin.read().strip()
            if not input_data:
                error_html = parser.create_error_html('No input data provided')
                print(error_html)
                return
            if parser.is_html_content(input_data):
                print(input_data)
                return
            result = parser.parse_html_direct(input_data)
            print(result)
    else:
        # Новая логика с аргументами
        arg_parser = argparse.ArgumentParser(description='Автоматический парсер')
        arg_parser.add_argument('--mode', choices=['folder', 'api', 'once'], 
                               help='Режим работы: folder - мониторинг папки, api - запуск API сервера, once - разовый парсинг URL')
        arg_parser.add_argument('--folder', default='watch_folder', help='Папка для мониторинга (для режима folder)')
        arg_parser.add_argument('--urls', nargs='+', help='URL для разового парсинга (для режима once)')
        arg_parser.add_argument('--host', default='0.0.0.0', help='Хост для API (для режима api)')
        arg_parser.add_argument('--port', type=int, default=5000, help='Порт для API (для режима api)')
        arg_parser.add_argument('--output', default='auto_output', help='Папка для сохранения результатов (для режима once)')
        
        args = arg_parser.parse_args()
        
        # Если режим не указан, но есть URLs, то используем режим once
        if not args.mode and args.urls:
            args.mode = 'once'
        
        # Если режим не указан и нет URLs, то выводим справку
        if not args.mode:
            arg_parser.print_help()
            return
        
        if args.mode == 'folder':
            parser.start_folder_monitoring(args.folder)
        
        elif args.mode == 'api':
            parser.start_api_server(args.host, args.port)
        
        elif args.mode == 'once':
            if not args.urls:
                print("Для режима 'once' необходимо указать URLs через --urls")
                return
            parser.run_once(args.urls, args.output)

if __name__ == '__main__':
    main()