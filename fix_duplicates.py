with open(r'D:\CryptoAnalyzer\frontend\src\pages\public\CoinAnalysis.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the second PredictionsSection
first = content.find('const PredictionsSection = React.memo(function PredictionsSection')
second = content.find('const PredictionsSection = React.memo(function PredictionsSection', first + 1)
print(f'First at: {content.find("const PredictionsSection = React.memo(function PredictionsSection")}')
print(f'Second at: {second}')

# Find the end of the second PredictionsSection (next function or export)
next_section = content.find('function TabPanel', second)
print(f'Next section at: {next_section}')

# Remove the duplicate
new_content = content[:second] + content[content.find('function TabPanel', second):]

with open(r'D:\CryptoAnalyzer\frontend\src\pages\public\CoinAnalysis.jsx', 'w', encoding='utf-8') as f:
    f.write(content[:second] + content[content.find('function TabPanel', second):])

print('Done removing duplicate PredictionsSection!')