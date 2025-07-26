import os
import time
import requests

# ✅ Working client ID
CLIENT_ID = 'CCbVVppXByCBrh4OcGmbrgyYhni0SgvL'

# 🔗 Your SoundCloud profile URL (clean, no trailing slash)
USER_URL = 'https://soundcloud.com/crittersmusic'

# 🛡️ Headers to fake being a normal-ass browser
HEADERS = {
    "User-Agent": "Mozilla/5.0",
    "Accept": "application/json"
}

def resolve_user(url):
    print("🔍 Resolving user...")
    resolve_url = f'https://api-v2.soundcloud.com/resolve?url={url}&client_id={CLIENT_ID}'
    r = requests.get(resolve_url, headers=HEADERS)
    print("🧪 Resolve status:", r.status_code)
    print("📦 Resolve response:", r.text[:300])
    if r.status_code != 200:
        raise Exception("❌ Failed to resolve user. Check client_id or URL.")
    return r.json()

def get_user_tracks(user_id):
    print("🎣 Fetching tracks...")
    tracks = []
    next_href = f'https://api-v2.soundcloud.com/users/{user_id}/tracks?client_id={CLIENT_ID}&limit=50'

    while next_href:
        r = requests.get(next_href, headers=HEADERS)
        print("🧪 API Response:", r.status_code)

        if r.status_code == 403:
            print("🛑 403 Forbidden – rate-limited or blocked. Waiting 10s and retrying...")
            time.sleep(10)
            continue

        if r.status_code != 200:
            print("❌ Failed URL:", next_href)
            raise Exception("❌ Failed to fetch tracks.")

        data = r.json()
        if 'collection' not in data:
            raise Exception("❌ No 'collection' in API response. Are your tracks public?")
        
        tracks.extend(data['collection'])
        next_href = data.get('next_href')
        if next_href:
            next_href += f"&client_id={CLIENT_ID}"

    return tracks

def download_track(track):
    title = track['title'].replace('/', '_').replace('\\', '_')
    print(f"🎵 Downloading: {title}")

    # Find the "progressive" stream
    transcodings = track.get('media', {}).get('transcodings', [])
    progressive_url = None

    for t in transcodings:
        if t.get('format', {}).get('protocol') == 'progressive':
            progressive_url = t.get('url')
            break

    if not progressive_url:
        print(f"⚠️ No progressive stream found for {title}")
        return

    # Get the real stream URL
    stream_info = requests.get(f"{progressive_url}?client_id={CLIENT_ID}", headers=HEADERS)
    if stream_info.status_code != 200:
        print(f"⚠️ Failed to get stream URL for {title} (Status: {stream_info.status_code})")
        return

    actual_url = stream_info.json().get('url')
    if not actual_url:
        print(f"⚠️ No 'url' found in stream response for {title}")
        return

    # Download the MP3
    r = requests.get(actual_url, stream=True, headers=HEADERS)
    if r.status_code == 200:
        with open(f"{title}.mp3", 'wb') as f:
            for chunk in r.iter_content(1024):
                f.write(chunk)
        print(f"✅ Saved: {title}.mp3")
    else:
        print(f"❌ Failed to download {title} (Status: {r.status_code})")

def main():
    user = resolve_user(USER_URL)
    user_id = user['id']
    tracks = get_user_tracks(user_id)
    print(f"📦 Found {len(tracks)} tracks.")
    for track in tracks:
        download_track(track)

if __name__ == "__main__":
    main()

