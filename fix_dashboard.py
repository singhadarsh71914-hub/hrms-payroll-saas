path = r'client\src\pages\EmployeeDashboard.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

fixes = [
    # Fix handleCheckIn: remove STEP 6 log, STEP 7 log, and console.warn
    (
        "          geoData = { latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy };\n"
        "          console.log('STEP 6: GPS captured', geoData);\n"
        "        } catch (e) {\n"
        "          console.warn('Geolocation capture failed', e);\n"
        "        }\n"
        "      }\n"
        "\n"
        "      console.log('STEP 7: Calling API /attendance/check-in');\n"
        "      await api.post('/attendance/check-in',",
        "          geoData = { latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy };\n"
        "        } catch (_e) {\n"
        "          // Geolocation unavailable or denied - proceed without location\n"
        "        }\n"
        "      }\n"
        "\n"
        "      await api.post('/attendance/check-in',"
    ),
    # Fix handleCheckOut: remove console.warn
    (
        "        } catch (e) {\n"
        "          console.warn('Geolocation capture failed', e);\n"
        "        }\n"
        "      }\n"
        "\n"
        "      await api.post('/attendance/check-out',",
        "        } catch (_e) {\n"
        "          // Geolocation unavailable or denied - proceed without location\n"
        "        }\n"
        "      }\n"
        "\n"
        "      await api.post('/attendance/check-out',"
    ),
]

for i, (old, new) in enumerate(fixes):
    if old in content:
        content = content.replace(old, new)
        print(f"Fix {i+1}: DONE")
    else:
        print(f"Fix {i+1}: NOT FOUND - checking...")
        # find nearest similar text
        key = old[:50].replace('\n','\\n')
        idx = content.find(old[:30])
        if idx >= 0:
            print(f"  Partial match at {idx}: {repr(content[idx:idx+100])}")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

# Verify no console.log/warn remain
remaining = [(i+1, line.strip()) for i, line in enumerate(content.split('\n')) if 'console.log' in line or 'console.warn' in line]
if remaining:
    print(f"Remaining console statements: {remaining}")
else:
    print("SUCCESS: No console.log/warn remaining in EmployeeDashboard.tsx")
