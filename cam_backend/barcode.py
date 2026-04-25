import sys
import select

def scan_barcode(timeout=None):
    """
    Blocks until barcode is scanned (keyboard scanner).
    Can optionally take a timeout.
    """
    try:
        print("\n📦 [BARCODE] Waiting for scan... (Ensure terminal is focused)")
        sys.stdout.flush()

        # If timeout is provided, use select to wait
        if timeout:
            ready, _, _ = select.select([sys.stdin], [], [], timeout)
            if not ready:
                print("⏳ [BARCODE] Scan timed out.")
                return None

        # Read line from stdin
        barcode = sys.stdin.readline().strip()
        
        if barcode:
            print(f"✅ [BARCODE] Scanned: {barcode}")
            return barcode
        return None

    except Exception as e:
        print(f"❌ [BARCODE] Error: {e}")
        return None