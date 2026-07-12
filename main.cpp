#include <iostream>
#include <glad/glad.h>
#include <GLFW/glfw3.h>
#include <cmath>

#include "VAO.h"
#include "VBO.h"
#include "EBO.h"
#include "shader.h"
#include "camera.h"

#define STB_IMAGE_IMPLEMENTATION
#include "stb_image.h"

#define SCREEN_WIDTH 1920
#define SCREEN_HEIGHT 1080
#define SCREEN_NAME "Raytracer"

unsigned int loadTexture(std::string path);
void resizeWindow(GLFWwindow*, int, int);
void mouseCallback(GLFWwindow* window, double xpos, double ypos);
void updateUniforms(glm::vec3 cameraPos, glm::vec3 cameraFront, Shader& shaderProgram);

Camera camera = Camera(glm::vec3(0.0f, 0.0f, 0.0f),
	                   glm::vec3(0.0f, 0.0f, 1.0f),
	                   glm::vec3(0.0f, 1.0f, 0.0f),
	                   2.5f, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);

int main() {
	glfwInit();

	glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
	glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
	glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);

	GLFWwindow* window = glfwCreateWindow(SCREEN_WIDTH, SCREEN_HEIGHT, SCREEN_NAME, NULL, NULL);
	if (window == NULL) {
		glfwTerminate();
		return -1;
	}

	glfwMakeContextCurrent(window);

	gladLoadGL();
	glViewport(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

	GLfloat vertices[] = {
		-1.0, -1.0, 0.0, 0.0, 0.0,
		-1.0,  1.0, 0.0, 0.0, 1.0,
		 1.0, -1.0, 0.0, 1.0, 0.0,
		 1.0,  1.0, 0.0, 1.0, 1.0
	};

	GLuint indices[] = {
		0, 1, 2,
		1, 2, 3
	};

	Shader shaderProgram("vertex.vert", "fragment.frag");

	VAO VAO1;

	VAO1.bindVAO();
	VBO VBO1(vertices, sizeof(vertices));
	EBO EBO1(indices, sizeof(indices));

	VAO1.linkAttrib(VBO1, 0, 3, GL_FLOAT, 5 * sizeof(float), (void*)0);
	VAO1.linkAttrib(VBO1, 1, 2, GL_FLOAT, 5 * sizeof(float), (void*)(3 * sizeof(float)));

	unsigned int skybox;
 	skybox = loadTexture("skybox/studio.jpg");

 	glActiveTexture(GL_TEXTURE0);
 	glBindTexture(GL_TEXTURE_2D, skybox);

 	shaderProgram.setInt("skybox", 0);

 	glfwSetCursorPosCallback(window, mouseCallback);
 	glfwSetWindowSizeCallback(window, resizeWindow);

	while (!glfwWindowShouldClose(window)) {
		glClearColor(0.0, 0.0, 0.0, 1.0);
		glClear(GL_COLOR_BUFFER_BIT);

		camera.processInputs(window);

		updateUniforms(camera.getPosition(), camera.getFront(), shaderProgram);

		glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);

		glfwSwapBuffers(window);
		glfwPollEvents();
	}

	VAO1.deleteVAO();
	VBO1.deleteVBO();
	EBO1.deleteEBO();

	glfwDestroyWindow(window);
	glfwTerminate();
}

unsigned int loadTexture(std::string path) {
	int width, height, nrChannels;
	unsigned char* data = stbi_load(path.c_str(), &width, &height, &nrChannels, 0);

	unsigned int texture;
	glGenTextures(1, &texture);
	glBindTexture(GL_TEXTURE_2D, texture);

	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);	
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST);

	if (data) {
		glTexImage2D(GL_TEXTURE_2D, 0, GL_RGB, width, height, 0, GL_RGB, GL_UNSIGNED_BYTE, data);
		glGenerateMipmap(GL_TEXTURE_2D);
	} else {
		std::cout << "Failure to load texture\n";
	}

	stbi_image_free(data);

	return texture;
}

void updateUniforms(glm::vec3 cameraPos, glm::vec3 cameraFront, Shader& shaderProgram) {
	glm::vec3 lookFrom = cameraPos;
	glm::vec3 lookAt = cameraPos + cameraFront;
	glm::vec3 lookUp = glm::vec3(0.0f, 1.0f, 0.0f);

	float fov = 90;
	float theta = glm::radians(fov);
	float h = tan(theta / 2);

	float focalLength = (lookFrom - lookAt).length();
	float viewportHeight = 2.0 * h * focalLength;
	float viewportWidth = viewportHeight * ((float)(SCREEN_WIDTH) / (float)(SCREEN_HEIGHT));
	
	glm::vec3 w = glm::normalize(lookFrom - lookAt);
	glm::vec3 u = glm::normalize(glm::cross(lookUp, w));
	glm::vec3 v = glm::cross(w, u);

	glm::vec3 vU = viewportWidth * u;
	glm::vec3 vV = viewportHeight * -v;
	glm::vec3 pdU = vU * (1.0f / SCREEN_WIDTH);
	glm::vec3 pdV = vV * (1.0f / SCREEN_HEIGHT);
	glm::vec3 topLeft = cameraPos - (focalLength * w) - (0.5f * vU) - (0.5f * vV);

	shaderProgram.activateShader();
	shaderProgram.setVec3f("cameraPos", cameraPos);
	shaderProgram.setVec3f("topLeft", topLeft);
	shaderProgram.setVec3f("u", pdU);
	shaderProgram.setVec3f("v", pdV);
	shaderProgram.setInt("screenWidth", SCREEN_WIDTH);
	shaderProgram.setInt("screenHeight", SCREEN_HEIGHT);
}

void mouseCallback(GLFWwindow* window, double xpos, double ypos) {
	camera.mouseCallback(window, xpos, ypos);
}

void resizeWindow(GLFWwindow* window, int width, int height) {
	glViewport(0, 0, width, height);
}
