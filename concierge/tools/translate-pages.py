"""Refresh cached translations of the actual published pages using existing local models.
Run explicitly after copy changes; normal builds use the checked-in dictionaries only.
"""
import json
import os
from pathlib import Path
from bs4 import BeautifulSoup, Comment

SITE = Path(__file__).resolve().parents[2]
DEST = SITE / 'concierge/locales'
ATTRS = ['alt', 'title', 'aria-label', 'placeholder', 'data-feature', 'data-goal-prompt']
META = ['description', 'keywords', 'og:title', 'og:description', 'twitter:title', 'twitter:description']


def segments():
    result = set()
    for file in (SITE / '.concierge/pages').glob('*.html'):
        soup = BeautifulSoup(file.read_text(encoding='utf-8'), 'html.parser')
        for node in soup.find_all(string=True):
            if isinstance(node, Comment) or node.find_parent(['script', 'style', 'svg', 'code', 'pre']):
                continue
            if node.strip():
                result.add(node.strip())
        for node in soup.find_all(True):
            for attr in ATTRS:
                if node.get(attr, '').strip():
                    result.add(node[attr].strip())
            if node.name == 'meta' and (node.get('name') or node.get('property')) in META:
                result.add(node.get('content', '').strip())
        def walk(value):
            if isinstance(value, dict):
                for key, item in value.items():
                    if key in ['name', 'description', 'headline', 'text'] and isinstance(item, str):
                        result.add(item)
                    else:
                        walk(item)
            elif isinstance(value, list):
                for item in value:
                    walk(item)
        for node in soup.select('script[type="application/ld+json"]'):
            walk(json.loads(node.string))
    return sorted(result - {''})


def model_translate(model_name, values):
    import torch
    from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
    os.environ['HF_HUB_OFFLINE'] = '1'
    tokenizer = AutoTokenizer.from_pretrained(model_name, local_files_only=True)
    model = AutoModelForSeq2SeqLM.from_pretrained(model_name, local_files_only=True)
    torch.set_num_threads(6)
    model.eval()
    output = []
    for start in range(0, len(values), 24):
        with torch.inference_mode():
            batch = tokenizer(values[start:start+24], return_tensors='pt', padding=True, truncation=True, max_length=512)
            generated = model.generate(**batch, max_new_tokens=192, num_beams=1, no_repeat_ngram_size=4)
        output.extend(tokenizer.batch_decode(generated, skip_special_tokens=True))
        print(f'{model_name}: {min(start+24,len(values))}/{len(values)}', flush=True)
    return output


if __name__ == '__main__':
    DEST.mkdir(exist_ok=True)
    source = segments()
    (DEST / 'segments.json').write_text(json.dumps(source, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    english = {}
    reviewed = json.loads((DEST/'reviewed.json').read_text(encoding='utf-8'))
    for lang in ['en', 'de']:
        cache = {}
        for file in [SITE/f'scripts/translations-{lang}.json', SITE/f'scripts/homepage-translations-{lang}.json', DEST/f'{lang}.json']:
            if file.exists():
                cache.update(json.loads(file.read_text(encoding='utf-8')))
        cache.update({key: values[0 if lang == 'en' else 1] for key, values in reviewed.items()})
        cache.update({text: text for text in source if not any(c.isalpha() for c in text)})
        missing = [text for text in source if text not in cache]
        values = missing if lang == 'en' else [english[text] for text in missing]
        model = 'Helsinki-NLP/opus-mt-sla-en' if lang == 'en' else 'Helsinki-NLP/opus-mt-en-de'
        cache.update(zip(missing, model_translate(model, values) if values else []))
        for text in source:
            if text.endswith(' ↗'):
                base = text[:-2]
                cache[text] = cache.get(base, cache[text].replace('ا', '').replace('↗', '').strip()) + ' ↗'
        cache = {text: cache[text] for text in source}
        (DEST/f'{lang}.json').write_text(json.dumps(cache, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
        if lang == 'en':
            english = cache
        print(f'Wrote {lang}: {len(cache)} translations', flush=True)
