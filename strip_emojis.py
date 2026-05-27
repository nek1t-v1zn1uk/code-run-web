import os
import re

emoji_pattern = re.compile(r'[\U00010000-\U0010ffff]')
# also capture common small emojis like ⏱️, ⚙️, ℹ️ which are in the U+2000 to U+3000 range or have variation selectors
extra_emojis = re.compile(r'[\u2600-\u27BF\u2300-\u23FF\u2B50\u2B06\u2934\u2935\u25B6\u25C0\u25A0\u25AA\u25AB\u25FE\u25FD\u25FC\u25FB\u25B6\u25C0\u23EA\u23E9\u23EB\u23EC\u23F0\u23F3\u231A\u231B\u2328\u23CF\u23E9\u23EA\u23EB\u23EC\u23ED\u23EE\u23EF\u23F0\u23F1\u23F2\u23F3\u23F8\u23F9\u23FA\u23FB\u23FC\u23FD\u23FE\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u25FD\u25FE\u2600\u2601\u2602\u2603\u2604\u260E\u2611\u2614\u2615\u2618\u261D\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638\u2639\u263A\u2648\u2649\u264A\u264B\u264C\u264D\u264E\u264F\u2650\u2651\u2652\u2653\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692\u2693\u2694\u2695\u2696\u2697\u2699\u269B\u269C\u26A0\u26A1\u26AA\u26AB\u26B0\u26B1\u26BD\u26BE\u26C4\u26C5\u26C8\u26CE\u26CF\u26D1\u26D3\u26D4\u26E9\u26EA\u26F0\u26F1\u26F2\u26F3\u26F4\u26F5\u26F7\u26F8\u26F9\u26FA\u26FD\u2702\u2705\u2708\u2709\u270A\u270B\u270C\u270D\u270F\u2712\u2714\u2716\u271D\u2721\u2728\u2733\u2734\u2744\u2747\u274C\u274E\u2753\u2754\u2755\u2757\u2763\u2764\u2795\u2796\u2797\u27A1\u27B0\u27BF\uFE0F]+')

for root, dirs, files in os.walk('src/app'):
    for file in files:
        if file.endswith('.html'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            new_content = emoji_pattern.sub('', content)
            new_content = extra_emojis.sub('', new_content)
            # also remove spans that are now empty: <span class="..."></span> if they contain nothing except whitespace
            new_content = re.sub(r'<span class="[^"]*icon[^"]*">\s*</span>', '', new_content)
            
            if new_content != content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f'Stripped {path}')
