#ifndef CAMERA_H
#define CAMERA_H

#include <cmath>
#include <glad/glad.h>
#include <glm/glm.hpp>
#include <glm/gtc/matrix_transform.hpp>
#include <glm/gtc/type_ptr.hpp>
#include <GLFW/glfw3.h>
#include "shader.h"

#define DEFAULT_CAMERA_POS glm::vec3(0.0f, 0.0f, 0.0f)
#define DEFAULT_CAMERA_FRONT glm::vec3(0.0f, 0.0f, 1.0f)
#define DEFAULT_CAMERA_UP glm::vec3(0.0f, 1.0f, 0.0f)
#define DEFAULT_CAMERA_UNITS_PER_SECOND 2.5f

class Camera
{
private:
	bool firstMouse;
	float lastX, lastY;
	float yaw, pitch;
	float currentFrame, lastFrame;
	float deltaTime;
	float unitsPerSecond;

	glm::vec3 cameraPos;
	glm::vec3 cameraFront;
	glm::vec3 cameraUp;

	glm::mat4 model;
	glm::mat4 view;
	glm::mat4 projection;

	bool isFPS;

public:
	Camera(glm::vec3 _cameraPos, glm::vec3 _cameraFront, glm::vec3 _cameraUp, float _unitsPerSecond, float firstX, float firstY);
	void updateFirstXY(float firstX, float firstY);
	void processInputs(GLFWwindow* window);
	void setFPS(bool _isFps);
	void mouseCallback(GLFWwindow* window, double xpos, double ypos);
	glm::vec3 getPosition();
	glm::vec3 getFront();
};

#endif