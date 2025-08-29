#!/usr/bin/env python3
"""
Port cleanup utility for the misinformation detection server
"""
import subprocess
import sys
import os

def kill_port(port=8003):
    """Kill any process using the specified port"""
    try:
        # Find processes using the port
        if os.name == 'nt':  # Windows
            result = subprocess.run(
                ['netstat', '-ano'], 
                capture_output=True, 
                text=True
            )
            
            lines = result.stdout.split('\n')
            pids_to_kill = []
            
            for line in lines:
                if f':{port}' in line and 'LISTENING' in line:
                    parts = line.split()
                    if len(parts) >= 5:
                        pid = parts[-1]
                        if pid.isdigit():
                            pids_to_kill.append(pid)
            
            # Kill the processes
            for pid in pids_to_kill:
                try:
                    subprocess.run(['taskkill', '/PID', pid, '/F'], check=True)
                    print(f"✅ Killed process {pid} using port {port}")
                except subprocess.CalledProcessError:
                    print(f"⚠️ Could not kill process {pid}")
                    
        else:  # Unix/Linux/Mac
            result = subprocess.run(
                ['lsof', '-ti', f':{port}'], 
                capture_output=True, 
                text=True
            )
            
            pids = result.stdout.strip().split('\n')
            for pid in pids:
                if pid.isdigit():
                    try:
                        subprocess.run(['kill', '-9', pid], check=True)
                        print(f"✅ Killed process {pid} using port {port}")
                    except subprocess.CalledProcessError:
                        print(f"⚠️ Could not kill process {pid}")
        
        print(f"🧹 Port {port} cleanup completed")
        
    except Exception as e:
        print(f"❌ Error during port cleanup: {e}")

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8003
    print(f"🔍 Cleaning up port {port}...")
    kill_port(port)