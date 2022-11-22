import sys
import json
data = sys.stdin.readlines()
data = json.loads(data[0])
print(data[0]+10)
sys.stdout.flush()
