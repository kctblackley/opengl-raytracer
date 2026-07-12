#include "camera.h"
#include "shader.h"

#define MOVEMENT_SPEED 10
#define ROTATION_SENSITIVITY 0.5

Camera::Camera(glm::vec3 _cameraPos, glm::vec3 _cameraFront, glm::vec3 _cameraUp, float _unitsPerSecond, float firstX, float firstY) {
	cameraPos = _cameraPos;
	cameraFront = _cameraFront;
	cameraUp = _cameraUp;
	unitsPerSecond = _unitsPerSecond;

	deltaTime = 0.0f;
	currentFrame = 0.0f;
	lastFrame = 0.0f;

	model = glm::mat4(1.0f);
	view = glm::mat4(1.0f);
	projection = glm::mat4(1.0f);

	lastX = firstX;
	lastY = firstY;

	firstMouse = true;
	
	yaw = -90.0f;
	pitch = 0.0f;

	isFPS = false;
}

void Camera::updateFirstXY(float firstX, float firstY) {
	lastX = firstX;
	lastY = firstY;
}

void Camera::setFPS(bool _isFPS) {
	isFPS = _isFPS;
}

void Camera::processInputs(GLFWwindow* window) {
	currentFrame = glfwGetTime();
	deltaTime = currentFrame - lastFrame;
	lastFrame = currentFrame;

	float cameraSpeed = MOVEMENT_SPEED * deltaTime;

	glm::vec3 forwardVector = cameraFront * cameraSpeed;
	if (isFPS) { forwardVector.y = 0.0f; }

	glm::vec3 rightVector = glm::normalize(glm::cross(cameraFront, cameraUp)) * cameraSpeed;
	if (isFPS) { rightVector.y = 0.0f; }

	if (glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS) {
		glfwSetWindowShouldClose(window, true);
	}
	if (glfwGetKey(window, GLFW_KEY_W) == GLFW_PRESS) {
		cameraPos += forwardVector;
	}
	if (glfwGetKey(window, GLFW_KEY_S) == GLFW_PRESS) {
		cameraPos -= forwardVector;
	}
	if (glfwGetKey(window, GLFW_KEY_D) == GLFW_PRESS) {
		cameraPos += rightVector;
	}
	if (glfwGetKey(window, GLFW_KEY_A) == GLFW_PRESS) {
		cameraPos -= rightVector;
	}
}

void Camera::mouseCallback(GLFWwindow* window, double xpos, double ypos) {
	if (firstMouse) {
		lastX = xpos;
		lastY = ypos;
		firstMouse = false;
	}

	float xoffset = xpos - lastX;
	float yoffset = lastY - ypos;

	lastX = xpos;
	lastY = ypos;

	const float sensitivity = ROTATION_SENSITIVITY;
	xoffset *= sensitivity;
	yoffset *= sensitivity;

	yaw += xoffset;
	pitch += yoffset;

	if (pitch > 89.0f) {
		pitch = 89.0f;
	}
	else if (pitch < -89.0f) {
		pitch = -89.0f;
	}

	glm::vec3 direction;
	direction.x = cos(glm::radians(yaw)) * cos(glm::radians(pitch));
	direction.y = sin(glm::radians(pitch));
	direction.z = sin(glm::radians(yaw)) * cos(glm::radians(pitch));

	cameraFront = glm::normalize(direction);
}

glm::vec3 Camera::getPosition() {
	return cameraPos;
}

glm::vec3 Camera::getFront() {
	return cameraFront;
}