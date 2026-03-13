using System;
using System.IO;
using System.Text.Json;
using System.Text.RegularExpressions;

class UniversalParser
{
    static void Main(string[] args)
    {
        if (args.Length != 1)
        {
            Console.Error.WriteLine("Usage: universal_parser <file>");
            Environment.Exit(1);
        }

        try
        {
            string filePath = args[0];
            string extension = Path.GetExtension(filePath).ToLower();
            string content = File.ReadAllText(filePath);

            object result = extension switch
            {
                ".json" => ParseJson(content),
                ".csv" => ParseCsv(content),
                ".xml" => ParseXml(content),
                _ => ParseText(content)
            };

            string output = JsonSerializer.Serialize(result, new JsonSerializerOptions 
            { 
                WriteIndented = true,
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });
            
            Console.WriteLine(output);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Error: {ex.Message}");
            Environment.Exit(1);
        }
    }

    static object ParseJson(string content)
    {
        return JsonDocument.Parse(content);
    }

    static object ParseCsv(string content)
    {
        var lines = content.Split('\n');
        if (lines.Length == 0) return new { headers = new string[0], rows = new object[0] };

        var headers = lines[0].Split(','); 
        var rows = new object[lines.Length - 1];

        for (int i = 1; i < lines.Length; i++)
        {
            if (string.IsNullOrWhiteSpace(lines[i])) continue;
            var values = lines[i].Split(',');
            rows[i - 1] = new { values };
        }

        return new { headers, rows };
    }

    static object ParseXml(string content)
    {
        // Простой XML парсинг (можно улучшить)
        return new { 
            contentLength = content.Length,
            hasXmlDeclaration = content.StartsWith("<?xml"),
            note = "XML parsing requires System.Xml namespace"
        };
    }

    static object ParseText(string content)
    {
        var words = Regex.Matches(content, @"\b\w+\b").Count;
        var lines = content.Split('\n').Length;
        
        return new
        {
            characters = content.Length,
            lines = lines,
            words = words
        };
    }
}
