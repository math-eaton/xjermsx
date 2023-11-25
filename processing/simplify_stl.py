import trimesh
import numpy as np
from stl import mesh

def simplify_stl(file_path, target_faces):
    # Load the mesh
    original_mesh = trimesh.load_mesh(file_path)

    print(f"Number of faces in the original mesh: {len(original_mesh.faces)}")

    # Simplify the mesh using the correct method
    simplified_mesh = original_mesh.simplify_quadric_decimation(target_faces)

    # Convert to numpy-stl mesh
    data = np.zeros(len(simplified_mesh.faces), dtype=mesh.Mesh.dtype)
    for i, f in enumerate(simplified_mesh.faces):
        for j in range(3):
            data['vectors'][i][j] = simplified_mesh.vertices[f[j]]

    # Create the mesh
    simplified_stl = mesh.Mesh(data)
    return simplified_stl

# Example usage
input_file = '/Users/matthewheaton/Documents/GitHub/xjermsx/output/empire-state-building-by-miniworld-3d.stl'  # Replace with your STL file path
output_file = '/Users/matthewheaton/Documents/GitHub/xjermsx/public/empireState_simplified.stl' # Replace with your desired output file path
target_faces = 5000  # Set the target number of faces

simplified_stl = simplify_stl(input_file, target_faces)
simplified_stl.save(output_file)