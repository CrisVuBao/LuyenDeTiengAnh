import sys
import fitz
import re
import json

sys.stdout.reconfigure(encoding='utf-8')

def parse_pdf():
    doc = fitz.open('3000TuVungTiengAnhTheoChuDe.pdf')
    print(f"Opened PDF with {len(doc)} pages.")

    topic_starts = []
    for pno in range(3, len(doc)):
        page = doc[pno]
        text = page.get_text()
        m = re.search(r'(\d+)\.\s*Từ\s*vựng\s*về\s*([^\n\r]+)', text)
        if m:
            topic_starts.append({
                'topicNumber': int(m.group(1)),
                'title': m.group(2).strip(),
                'startPage': pno + 1
            })

    for i in range(len(topic_starts)):
        if i < len(topic_starts) - 1:
            topic_starts[i]['endPage'] = topic_starts[i+1]['startPage'] - 1
        else:
            topic_starts[i]['endPage'] = len(doc)

    all_topics = []
    total_words = 0

    # Topic Icons / Category mapping for engaging UI
    ICON_MAP = {
        1: 'BookOpen', 2: 'Activity', 3: 'Sun', 4: 'Compass', 5: 'Hash',
        6: 'ShoppingBag', 7: 'Moon', 8: 'HeartHandshake', 9: 'UtensilsCrossed', 10: 'Sparkles',
        11: 'TreePine', 12: 'Sofa', 13: 'Cross', 14: 'Laptop', 15: 'Home',
        16: 'Store', 17: 'Gamepad2', 18: 'Plane', 19: 'MoonStar', 20: 'Trophy',
        21: 'Building2', 22: 'Heart', 23: 'PlaneTakeoff', 24: 'HeartPulse', 25: 'Salad',
        26: 'Clock', 27: 'Car', 28: 'Smile', 29: 'UserCheck', 30: 'Coffee',
        31: 'Flower2', 32: 'Film', 33: 'Award', 34: 'Gift', 35: 'Utensils',
        36: 'Music', 37: 'HeartFilled', 38: 'Hotel', 39: 'GraduationCap', 40: 'Palette',
        41: 'CloudSun', 42: 'Shirt', 43: 'Footprints', 44: 'School', 45: 'Users',
        46: 'Apple', 47: 'Cat', 48: 'Bug', 49: 'BookMarked', 50: 'Sprout',
        51: 'Globe2', 52: 'Fish', 53: 'Zap', 54: 'Briefcase', 55: 'Apple',
        56: 'Flame', 57: 'Navigation', 58: 'BedDouble', 59: 'Mail', 60: 'Landmark'
    }

    for t in topic_starts:
        words = []
        tnum = t['topicNumber']
        for p in range(t['startPage'], t['endPage'] + 1):
            page = doc[p - 1]
            tabs = page.find_tables()
            if not tabs.tables:
                continue
            for tab in tabs.tables:
                rows = tab.extract()
                for r in rows:
                    if not r or not r[0]:
                        continue
                    w = re.sub(r'\s+', ' ', str(r[0])).strip()
                    if any(h in w.lower() for h in ['từ vựng', 'từvựng']):
                        continue
                    pos = re.sub(r'\s+', ' ', str(r[1])).strip() if len(r) > 1 and r[1] else ''
                    ipa = re.sub(r'\s+', ' ', str(r[2])).strip() if len(r) > 2 and r[2] else ''
                    meaning = re.sub(r'\s+', ' ', str(r[3])).strip() if len(r) > 3 and r[3] else ''

                    # Clean up ipa formatting
                    ipa = ipa.replace('ˌ ', 'ˌ').replace(' ˌ', 'ˌ')
                    ipa = ipa.replace('ˈ ', 'ˈ').replace(' ˈ', 'ˈ')
                    if ipa and not ipa.startswith('/') and '/' in ipa:
                        ipa = '/' + ipa
                    if ipa and not ipa.endswith('/') and '/' in ipa:
                        ipa = ipa + '/'

                    words.append({
                        'id': f'v_{tnum}_{len(words) + 1}',
                        'word': w,
                        'pos': pos,
                        'ipa': ipa,
                        'meaning': meaning
                    })

        clean_title = t['title'].capitalize()
        # Clean title spaces and accents
        clean_title = clean_title.replace('Từvựng về', '').replace('Từ vựng về', '').strip()
        if clean_title.startswith('đồdùng'):
            clean_title = clean_title.replace('đồdùng', 'Đồ dùng')
        elif clean_title.startswith('chủđề'):
            clean_title = clean_title.replace('chủđề', 'Chủ đề')
        clean_title = clean_title[0].upper() + clean_title[1:] if clean_title else ''

        all_topics.append({
            'id': tnum,
            'topicNumber': tnum,
            'title': clean_title,
            'fullTitle': f"Từ vựng về {clean_title.lower()}",
            'icon': ICON_MAP.get(tnum, 'Layers'),
            'wordCount': len(words),
            'startPage': t['startPage'],
            'endPage': t['endPage'],
            'words': words
        })
        total_words += len(words)

    print(f"Total topics parsed: {len(all_topics)}")
    print(f"Total vocabulary parsed: {total_words}")

    # Output to Frontend data file
    output_path = 'Frontend/src/data/vocab3000Data.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump({
            'totalTopics': len(all_topics),
            'totalWords': total_words,
            'topics': all_topics
        }, f, ensure_ascii=False, indent=2)

    print(f"Successfully saved to {output_path}!")

if __name__ == '__main__':
    parse_pdf()
