from PIL import Image
import svgwrite

def apply_threshold_filter(img):
    """Applies a 50% threshold filter to convert the image to black and white."""
    print("Applying threshold filter...")
    # Convert to grayscale if the image is colored
    if img.mode not in ['1', 'L']:
        img = img.convert('L')
    # Apply threshold (128 out of 255 is 50%)
    return img.point(lambda p: p > 128 and 255)

def resize_image(img, target_dpi=72, original_dpi=300):
    """Resize the image to target DPI using bilinear interpolation."""
    print("Resizing the image...")
    ratio = target_dpi / original_dpi
    new_size = (int(img.width * ratio), int(img.height * ratio))
    return img.resize(new_size, Image.BILINEAR)

def process_horizontal_lines(img):
    """Process the image line by line to find horizontal lines of black pixels."""
    print("Processing horizontal lines...")
    pixels = img.load()
    lines = []

    for y in range(img.height):
        start_x = None
        for x in range(img.width):
            if pixels[x, y] == 0:  # Black pixel
                if start_x is None:
                    start_x = x
            else:
                if start_x is not None:
                    lines.append((start_x, y, x - start_x, 1))
                    start_x = None
        if start_x is not None:  # Handle line end
            lines.append((start_x, y, img.width - start_x, 1))

    print(f"Found {len(lines)} lines to process.")
    return lines

def png_to_svg(png_file, svg_file, target_dpi=72, original_dpi=300):
    print(f"Opening image file: {png_file}")
    img = Image.open(png_file)

    img = apply_threshold_filter(img)
    img = img.convert('1')  # Convert image to black and white

    img = resize_image(img, target_dpi, original_dpi)

    dwg = svgwrite.Drawing(svg_file, size=img.size)
    lines = process_horizontal_lines(img)

    print("Creating SVG elements...")
    for x, y, width, height in lines:
        dwg.add(dwg.rect(insert=(x, y), size=(width, height), fill='black'))

    print(f"Saving SVG file: {svg_file}")
    dwg.save()
    print("SVG file saved successfully.")


png_to_svg('/Users/matthewheaton/Documents/GitHub/xjermsx/output/Sample.jpg', '/Users/matthewheaton/Documents/GitHub/xjermsx/public/track.svg', target_dpi=300, original_dpi=300)
print("done.")