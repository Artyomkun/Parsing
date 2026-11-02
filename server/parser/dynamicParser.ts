import { Parsing } from "../types/types";

export const parseDynamicContent = async (
    url: string,
    selector: string,
    options: Parsing.ParseOptions
): Promise<Parsing.ParseResult[]> => {
    const res = await fetch(url, {
        headers: options.headers,
        credentials: options.cookies ? 'include' : 'same-origin',
    });
    const html = await res.text();

    const doc = new DOMParser().parseFromString(html, 'text/html');
    const elements = doc.querySelectorAll(selector);

    return Array.from(elements).map((el) => {
        const attributes: Record<string, string> = {};
        for (const attr of Array.from(el.attributes)) {
            attributes[attr.name] = attr.value;
        }
        return {
            success: true,
            text: el.textContent?.trim() || '',
            html: options.returnHtml ? el.outerHTML : undefined,
            attributes,
        };
    });
};