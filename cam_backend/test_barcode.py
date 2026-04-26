from barcode import scan_barcode

if __name__ == "__main__":
    print("Testing barcode scanner...")
    code = scan_barcode()
    print(f"Result: {code}")
