with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

import re
# Remove the mobile switcher select block
content = re.sub(
    r'\{\/\* Mobile/Tablet user profile switcher.*?<\/div>',
    '',
    content,
    flags=re.DOTALL
)

with open('frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
