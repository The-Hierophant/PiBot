#!/usr/bin/python3
# TODO:add a servo
import sys, time
import RPi.GPIO as GPIO
GPIO.setmode(GPIO.BCM)
GPIO.setup(26, GPIO.OUT)
pwm=GPIO.PWM(26,50)
pwm.start(float(sys.argv[1])