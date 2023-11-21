from PIL import Image
import svgwrite

def find_contiguous_pixels(img):
    """Finds contiguous black pixels and returns their coordinates."""
    pixels = img.load()
    visited = set()
    regions = []

    for x in range(img.width):
        for y in range(img.height):
            if pixels[x, y] == 0 and (x, y) not in visited:
                stack = [(x, y)]
                region = []

                while stack:
                    px, py = stack.pop()
                    if (px, py) in visited:
                        continue

                    visited.add((px, py))
                    region.append((px, py))

                    for dx in [-1, 0, 1]:
                        for dy in [-1, 0, 1]:
                            nx, ny = px + dx, py + dy
                            if 0 <= nx < img.width and 0 <= ny < img.height and pixels[nx, ny] == 0:
                                stack.append((nx, ny))

                if region:
                    regions.append(region)

    return regions

def create_svg_path(region):
    """Creates an SVG path for a given region of contiguous pixels."""
    if not region:
        return ''

    # Starting point
    path = f"M {region[0][0]},{region[0][1]} "

    for (x, y) in region[1:]:
        path += f"L {x},{y} "

    path += 'Z'
    return path

def png_to_svg(png_file, svg_file):
    # Open the PNG file
    img = Image.open(png_file)
    img = img.convert('1')  # Convert image to black and white

    # Create a new SVG file
    dwg = svgwrite.Drawing(svg_file, size=img.size)

    # Find contiguous black pixel regions
    regions = find_contiguous_pixels(img)

    # Create path elements for each region
    for region in regions:
        path_data = create_svg_path(region)
        if path_data:
            dwg.add(dwg.path(d=path_data, fill='black'))

    # Save the SVG file
    dwg.save()

png_to_svg('/Users/matthewheaton/Documents/GitHub/xjermsx/output/moonalt.png', '/Users/matthewheaton/Documents/GitHub/xjermsx/output/moonalt.svg')
print("done.")

